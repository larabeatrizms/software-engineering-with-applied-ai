import { View } from './View.js';

export class BookView extends View {
    #bookList = document.querySelector('#bookList');

    #buttons;
    #bookTemplate;
    #onLikeBook;

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#bookTemplate = await this.loadTemplate('./src/view/templates/book-card.html');
    }

    onUserSelected(user) {
        this.setButtonsState(user.id ? false : true);
    }

    registerLikeBookCallback(callback) {
        this.#onLikeBook = callback;
    }

    render(books, disableButtons = true) {
        if (!this.#bookTemplate) return;
        const html = books.map(book => {
            return this.replaceTemplate(this.#bookTemplate, {
                id: book.id,
                name: book.name,
                genre: book.genre,
                author: book.author,
                pages: book.pages,
                book: JSON.stringify(book)
            });
        }).join('');

        this.#bookList.innerHTML = html;
        this.attachLikeButtonListeners();

        this.setButtonsState(disableButtons);
    }

    setButtonsState(disabled) {
        if (!this.#buttons) {
            this.#buttons = document.querySelectorAll('.like-btn');
        }
        this.#buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    attachLikeButtonListeners() {
        this.#buttons = document.querySelectorAll('.like-btn');
        this.#buttons.forEach(button => {

            button.addEventListener('click', (event) => {
                const book = JSON.parse(button.dataset.book);
                const originalText = button.innerHTML;

                button.innerHTML = '<i class="bi bi-heart-fill"></i> Liked';
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');
                }, 500);
                this.#onLikeBook(book, button);

            });
        });
    }
}
