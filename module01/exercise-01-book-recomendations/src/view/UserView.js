import { View } from './View.js';

export class UserView extends View {
    #userSelect = document.querySelector('#userSelect');
    #userAge = document.querySelector('#userAge');
    #likedBooksList = document.querySelector('#likedBooksList');

    #likedTemplate;
    #onUserSelect;
    #onLikedRemove;
    #likedBookElements = [];

    constructor() {
        super();
        this.init();
    }

    async init() {
        this.#likedTemplate = await this.loadTemplate('./src/view/templates/liked-book.html');
        this.attachUserSelectListener();
    }

    registerUserSelectCallback(callback) {
        this.#onUserSelect = callback;
    }

    registerLikedRemoveCallback(callback) {
        this.#onLikedRemove = callback;
    }

    renderUserOptions(users) {
        const options = users.map(user => {
            return `<option value="${user.id}">${user.name}</option>`;
        }).join('');

        this.#userSelect.innerHTML += options;
    }

    renderUserDetails(user) {
        this.#userAge.value = user.age;
    }

    renderLikedBooks(likedBooks) {
        if (!this.#likedTemplate) return;

        if (!likedBooks || likedBooks.length === 0) {
            this.#likedBooksList.innerHTML = '<p>Nenhum livro curtido ainda.</p>';
            return;
        }

        const html = likedBooks.map(book => {
            return this.replaceTemplate(this.#likedTemplate, {
                ...book,
                book: JSON.stringify(book)
            });
        }).join('');

        this.#likedBooksList.innerHTML = html;
        this.attachLikedClickHandlers();
    }

    addLikedBook(book) {

        if (this.#likedBooksList.innerHTML.includes('Nenhum livro curtido ainda')) {
            this.#likedBooksList.innerHTML = '';
        }

        const likedHtml = this.replaceTemplate(this.#likedTemplate, {
            ...book,
            book: JSON.stringify(book)
        });

        this.#likedBooksList.insertAdjacentHTML('afterbegin', likedHtml);

        const newLiked = this.#likedBooksList.firstElementChild.querySelector('.liked-book');
        newLiked.classList.add('liked-book-highlight');

        setTimeout(() => {
            newLiked.classList.remove('liked-book-highlight');
        }, 1000);

        this.attachLikedClickHandlers();
    }

    attachUserSelectListener() {
        this.#userSelect.addEventListener('change', (event) => {
            const userId = event.target.value ? Number(event.target.value) : null;

            if (userId) {
                if (this.#onUserSelect) {
                    this.#onUserSelect(userId);
                }
            } else {
                this.#userAge.value = '';
                this.#likedBooksList.innerHTML = '';
            }
        });
    }

    attachLikedClickHandlers() {
        this.#likedBookElements = [];

        const likedElements = document.querySelectorAll('.liked-book');

        likedElements.forEach(likedElement => {
            this.#likedBookElements.push(likedElement);

            likedElement.onclick = (event) => {

                const book = JSON.parse(likedElement.dataset.book);
                const userId = this.getSelectedUserId();
                const element = likedElement.closest('.col-md-6');

                this.#onLikedRemove({ element, userId, book });

                element.style.transition = 'opacity 0.5s ease';
                element.style.opacity = '0';

                setTimeout(() => {
                    element.remove();

                    if (document.querySelectorAll('.liked-book').length === 0) {
                        this.renderLikedBooks([]);
                    }

                }, 500);

            }
        });
    }

    getSelectedUserId() {
        return this.#userSelect.value ? Number(this.#userSelect.value) : null;
    }
}
