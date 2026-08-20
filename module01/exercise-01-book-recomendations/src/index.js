import { UserController } from './controller/UserController.js';
import { BookController } from './controller/BookController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { BookService } from './service/BookService.js';
import { UserView } from './view/UserView.js';
import { BookView } from './view/BookView.js';
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

const userService = new UserService();
const bookService = new BookService();

const userView = new UserView();
const bookView = new BookView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();
const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });

const w = WorkerController.init({
    worker: mlWorker,
    events: Events
});

const users = await userService.getDefaultUsers();
w.triggerTrain(users);


ModelController.init({
    modelView,
    userService,
    events: Events,
});

TFVisorController.init({
    tfVisorView,
    events: Events,
});

BookController.init({
    bookView,
    userService,
    bookService,
    events: Events,
});


const userController = UserController.init({
    userView,
    userService,
    events: Events,
});


userController.renderUsers({
    "id": 99,
    "name": "Josézin da Silva",
    "age": 30,
    "liked": []
});
