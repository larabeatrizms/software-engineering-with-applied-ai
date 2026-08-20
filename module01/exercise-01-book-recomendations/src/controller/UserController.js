export class UserController {
    #userService;
    #userView;
    #events;
    constructor({
        userView,
        userService,
        events,
    }) {
        this.#userView = userView;
        this.#userService = userService;
        this.#events = events;
    }

    static init(deps) {
        return new UserController(deps);
    }

    async renderUsers(nonTrainedUser) {
        const users = await this.#userService.getDefaultUsers();

        this.#userService.addUser(nonTrainedUser);
        const defaultAndNonTrained = [nonTrainedUser, ...users];

        this.#userView.renderUserOptions(defaultAndNonTrained);
        this.setupCallbacks();
        this.setupLikedObserver();

        this.#events.dispatchUsersUpdated({ users: defaultAndNonTrained });

    }

    setupCallbacks() {
        this.#userView.registerUserSelectCallback(this.handleUserSelect.bind(this));
        this.#userView.registerLikedRemoveCallback(this.handleLikedRemove.bind(this));
    }

    setupLikedObserver() {

        this.#events.onLikedAdded(
            async (...data) => {
                return this.handleLikedAdded(...data);
            }
        );

    }

    async handleUserSelect(userId) {
        const user = await this.#userService.getUserById(userId);
        this.#events.dispatchUserSelected(user);
        return this.displayUserDetails(user);
    }

    async handleLikedAdded({ user, book }) {
        const updatedUser = await this.#userService.getUserById(user.id);
        updatedUser.liked.push({
            ...book
        })

        await this.#userService.updateUser(updatedUser);

        const lastLiked = updatedUser.liked[updatedUser.liked.length - 1];
        this.#userView.addLikedBook(lastLiked);
        this.#events.dispatchUsersUpdated({ users: await this.#userService.getUsers() });
    }

    async handleLikedRemove({ userId, book }) {
        const user = await this.#userService.getUserById(userId);
        const index = user.liked.findIndex(item => item.id === book.id);

        if (index !== -1) {
            user.liked.splice(index, 1);
            await this.#userService.updateUser(user);

            const updatedUsers = await this.#userService.getUsers();
            this.#events.dispatchUsersUpdated({ users: updatedUsers });
        }
    }


    async displayUserDetails(user) {
        this.#userView.renderUserDetails(user);
        this.#userView.renderLikedBooks(user.liked);

    }

    getSelectedUserId() {
        return this.#userView.getSelectedUserId();
    }
}
