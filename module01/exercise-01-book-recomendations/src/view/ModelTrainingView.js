import { View } from './View.js';

export class ModelView extends View {
    #trainModelBtn = document.querySelector('#trainModelBtn');
    #likedArrow = document.querySelector('#likedArrow');
    #likedDiv = document.querySelector('#likedDiv');
    #allUsersLikedList = document.querySelector('#allUsersLikedList');
    #runRecommendationBtn = document.querySelector('#runRecommendationBtn');
    #onTrainModel;
    #onRunRecommendation;

    constructor() {
        super();
        this.attachEventListeners();
    }

    registerTrainModelCallback(callback) {
        this.#onTrainModel = callback;
    }
    registerRunRecommendationCallback(callback) {
        this.#onRunRecommendation = callback;
    }

    attachEventListeners() {
        this.#trainModelBtn.addEventListener('click', () => {
            this.#onTrainModel();
        });
        this.#runRecommendationBtn.addEventListener('click', () => {
            this.#onRunRecommendation();
        });

        this.#likedDiv.addEventListener('click', () => {
            const likedList = this.#allUsersLikedList;

            const isHidden = window.getComputedStyle(likedList).display === 'none';

            if (isHidden) {
                likedList.style.display = 'block';
                this.#likedArrow.classList.remove('bi-chevron-down');
                this.#likedArrow.classList.add('bi-chevron-up');
            } else {
                likedList.style.display = 'none';
                this.#likedArrow.classList.remove('bi-chevron-up');
                this.#likedArrow.classList.add('bi-chevron-down');
            }
        });

    }
    enableRecommendButton() {
        this.#runRecommendationBtn.disabled = false;
    }
    updateTrainingProgress(progress) {
        this.#trainModelBtn.disabled = true;
        this.#trainModelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Training...';

        if (progress.progress === 100) {
            this.#trainModelBtn.disabled = false;
            this.#trainModelBtn.innerHTML = 'Train Recommendation Model';
        }
    }

    renderAllUsersLiked(users) {
        const html = users.map(user => {
            const likedHtml = user.liked.map(book => {
                return `<span class="badge bg-light text-dark me-1 mb-1">${book.name}</span>`;
            }).join('');

            return `
                <div class="user-liked-summary">
                    <h6>${user.name} (Age: ${user.age})</h6>
                    <div class="liked-badges">
                        ${likedHtml || '<span class="text-muted">No liked books</span>'}
                    </div>
                </div>
            `;
        }).join('');

        this.#allUsersLikedList.innerHTML = html;
    }
}
