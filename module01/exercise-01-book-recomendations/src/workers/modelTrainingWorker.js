import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
import { workerEvents } from "../events/constants.js";
let _globalCtx = {};
let _model = null;

const WEIGHTS = {
  genre: 0.4,
  author: 0.3,
  pages: 0.2,
  age: 0.1,
};

const normalize = (value, min, max) => (value - min) / (max - min || 1);

function makeContext(books, users) {
  const ages = users.map((u) => u.age);
  const pages = books.map((b) => b.pages);

  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  const minPages = Math.min(...pages);
  const maxPages = Math.max(...pages);

  const authors = [...new Set(books.map((b) => b.author))];
  const genres = [...new Set(books.map((b) => b.genre))];

  const authorsIndex = Object.fromEntries(
    authors.map((author, index) => {
      return [author, index];
    }),
  );
  const genresIndex = Object.fromEntries(
    genres.map((genre, index) => {
      return [genre, index];
    }),
  );

  const midAge = (minAge + maxAge) / 2;
  const ageSums = {};
  const ageCounts = {};

  users.forEach((user) => {
    user.liked.forEach((b) => {
      ageSums[b.name] = (ageSums[b.name] || 0) + user.age;
      ageCounts[b.name] = (ageCounts[b.name] || 0) + 1;
    });
  });

  const bookAvgAgeNorm = Object.fromEntries(
    books.map((book) => {
      const avg = ageCounts[book.name]
        ? ageSums[book.name] / ageCounts[book.name]
        : midAge;

      return [book.name, normalize(avg, minAge, maxAge)];
    }),
  );

  return {
    books,
    users,
    authorsIndex,
    genresIndex,
    bookAvgAgeNorm,
    minAge,
    maxAge,
    minPages,
    maxPages,
    numGenres: genres.length,
    numAuthors: authors.length,
    dimentions: 2 + genres.length + authors.length,
  };
}

const oneHotWeighted = (index, length, weight) =>
  tf.oneHot(index, length).cast("float32").mul(weight);

function encodeBook(book, context) {
  const pages = tf.tensor1d([
    normalize(book.pages, context.minPages, context.maxPages) * WEIGHTS.pages,
  ]);

  const age = tf.tensor1d([
    (context.bookAvgAgeNorm[book.name] ?? 0.5) * WEIGHTS.age,
  ]);

  const genre = oneHotWeighted(
    context.genresIndex[book.genre],
    context.numGenres,
    WEIGHTS.genre,
  );

  const author = oneHotWeighted(
    context.authorsIndex[book.author],
    context.numAuthors,
    WEIGHTS.author,
  );

  return tf.concat1d([pages, age, genre, author]);
}

function encodeUser(user, context) {
  if (user.liked.length) {
    return tf
      .stack(user.liked.map((book) => encodeBook(book, context)))
      .mean(0)
      .reshape([1, context.dimentions]);
  }

  return tf
    .concat1d([
      tf.zeros([1]),
      tf.tensor1d([
        normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age,
      ]),
      tf.zeros([context.numGenres]),
      tf.zeros([context.numAuthors]),
    ])
    .reshape([1, context.dimentions]);
}

function createTrainingData(context) {
  const inputs = [];
  const labels = [];
  context.users
    .filter((u) => u.liked.length)
    .forEach((user) => {
      const userVector = encodeUser(user, context).dataSync();
      context.books.forEach((book) => {
        const bookVector = encodeBook(book, context).dataSync();

        const label = user.liked.some((liked) =>
          liked.name === book.name ? 1 : 0,
        );
        inputs.push([...userVector, ...bookVector]);
        labels.push(label);
      });
    });

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimention: context.dimentions * 2,
  };
}

async function configureNeuralNetAndTrain(trainData) {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimention],
      units: 128,
      activation: "relu",
    }),
  );
  model.add(
    tf.layers.dense({
      units: 64,
      activation: "relu",
    }),
  );
  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
    }),
  );
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        postMessage({
          type: workerEvents.trainingLog,
          epoch: epoch,
          loss: logs.loss,
          accuracy: logs.acc,
        });
      },
    },
  });

  return model;
}
async function trainModel({ users }) {
  console.log("Training model with users:", users);
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
  const books = await (await fetch("/data/books.json")).json();

  const context = makeContext(books, users);
  context.bookVectors = books.map((book) => {
    return {
      name: book.name,
      meta: { ...book },
      vector: encodeBook(book, context).dataSync(),
    };
  });

  _globalCtx = context;

  const trainData = createTrainingData(context);
  _model = await configureNeuralNetAndTrain(trainData);

  postMessage({
    type: workerEvents.progressUpdate,
    progress: { progress: 100 },
  });
  postMessage({ type: workerEvents.trainingComplete });
}
function recommend({ user }) {
  if (!_model) return;
  const context = _globalCtx;

  const userVector = encodeUser(user, context).dataSync();

  const inputs = context.bookVectors.map(({ vector }) => {
    return [...userVector, ...vector];
  });

  const inputTensor = tf.tensor2d(inputs);

  const predictions = _model.predict(inputTensor);

  const scores = predictions.dataSync();
  const recommendations = context.bookVectors.map((item, index) => {
    return {
      ...item.meta,
      name: item.name,
      score: scores[index],
    };
  });

  const sortedItems = recommendations.sort((a, b) => b.score - a.score);

  postMessage({
    type: workerEvents.recommend,
    user,
    recommendations: sortedItems,
  });
}
const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
};

self.onmessage = (e) => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
};
