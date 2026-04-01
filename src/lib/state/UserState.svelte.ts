class User {
    publicKey: string | null = $state(null);
    secretKey: string | null = $state(null);

    constructor() {
        if (Object.hasOwn(window.localStorage, 'mpp:demo:publicKey')) {
            this.publicKey = localStorage.getItem('mpp:demo:publicKey');
        }
        if (Object.hasOwn(window.localStorage, 'mpp:demo:secretKey')) {
            this.secretKey = localStorage.getItem('mpp:demo:secretKey');
        }
    }

    set = ({ publicKey, secretKey }: { publicKey: string; secretKey: string }) => {
        this.publicKey = publicKey;
        window.localStorage.setItem('mpp:demo:publicKey', publicKey);
        this.secretKey = secretKey;
        window.localStorage.setItem('mpp:demo:secretKey', secretKey);
    };

    reset = () => {
        this.publicKey = null;
        this.secretKey = null;
        window.localStorage.clear();
        window.location.reload();
    };
}

export const user = new User();
