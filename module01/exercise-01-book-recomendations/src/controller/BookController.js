export class BookController {
    #bookView;
    #currentUser = null;
    #events;
    #bookService;
    constructor({
        bookView,
        events,
        bookService
    }) {
        this.#bookView = bookView;
        this.#bookService = bookService;
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new BookController(deps);
    }

    async init() {
        this.setupCallbacks();
        this.setupEventListeners();
        const books = await this.#bookService.getBooks();
        this.#bookView.render(books, true);
    }

    setupEventListeners() {

        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            this.#bookView.onUserSelected(user);
            this.#events.dispatchRecommend(user)
        })

        this.#events.onRecommendationsReady(({ recommendations }) => {
            this.#bookView.render(recommendations, false);
        });
    }

    setupCallbacks() {
        this.#bookView.registerLikeBookCallback(this.handleLikeBook.bind(this));
    }

    async handleLikeBook(book) {
        const user = this.#currentUser;
        this.#events.dispatchLikedAdded({ user, book });
    }

}
