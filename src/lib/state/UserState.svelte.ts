import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';

export type StepStatus = 'idle' | 'active' | 'done' | 'error';
export type Step = { label: string; status: StepStatus; detail: string };

const SETUP_KEY = 'mpp:demo:setupComplete';
const PUBLIC_KEY_KEY = 'mpp:demo:publicKey';
const SECRET_KEY_KEY = 'mpp:demo:secretKey';

class User {
    publicKey: string | null = $state(null);
    secretKey: string | null = $state(null);

    steps: Step[] = $state([
        { label: 'Generate keypair', status: 'idle', detail: '' },
        { label: 'Fund with Friendbot', status: 'idle', detail: '' },
        { label: 'Create USDC trustline', status: 'idle', detail: '' },
    ]);

    isLoading = $derived(this.steps.some((s) => s.status === 'active'));
    isComplete = $derived(this.steps.every((s) => s.status === 'done'));
    hasError = $derived(this.steps.some((s) => s.status === 'error'));
    keypair: Keypair | null = $state(null);

    constructor() {
        if (Object.hasOwn(window.localStorage, PUBLIC_KEY_KEY)) {
            this.publicKey = localStorage.getItem(PUBLIC_KEY_KEY);
        }
        if (Object.hasOwn(window.localStorage, SECRET_KEY_KEY)) {
            this.secretKey = localStorage.getItem(SECRET_KEY_KEY);
        }
    }

    /** True if setup previously completed successfully. */
    get alreadySetUp(): boolean {
        return window.localStorage.getItem(SETUP_KEY) === 'true' && !!this.publicKey;
    }

    set = ({ publicKey, secretKey }: { publicKey: string; secretKey: string }) => {
        this.publicKey = publicKey;
        window.localStorage.setItem(PUBLIC_KEY_KEY, publicKey);
        this.secretKey = secretKey;
        window.localStorage.setItem(SECRET_KEY_KEY, secretKey);
    };

    private setStep(index: number, status: StepStatus, detail = '') {
        this.steps[index] = { ...this.steps[index], status, detail };
    }

    setup = async () => {
        if (this.isLoading) return;

        // Step 1: Generate keypair
        this.setStep(0, 'active', 'Generating...');
        if (!this.secretKey) {
            this.keypair = Keypair.random();
            this.set({ publicKey: this.keypair.publicKey(), secretKey: this.keypair.secret() });
        } else {
            this.keypair = Keypair.fromSecret(this.secretKey);
        }
        this.setStep(0, 'done', this.keypair.publicKey().slice(0, 8) + '...');

        // Step 2: Friendbot
        this.setStep(1, 'active', 'Requesting testnet XLM...');
        try {
            const res = await fetch('/api/faucet?step=friendbot', {
                method: 'POST',
                body: JSON.stringify({ publicKey: this.keypair.publicKey() }),
            });
            if (!res.ok) throw new Error('Friendbot request failed');
            const data = await res.json();
            this.setStep(1, 'done', `Funded (tx: ${data.hash?.slice(0, 8)}...)`);
        } catch (err) {
            this.setStep(1, 'error', err instanceof Error ? err.message : 'Failed');
            return;
        }

        // Step 3: Trustline
        this.setStep(2, 'active', 'Building trustline transaction...');
        try {
            const res = await fetch('/api/faucet?step=trustline', {
                method: 'POST',
                body: JSON.stringify({ publicKey: this.keypair.publicKey() }),
            });
            if (!res.ok) throw new Error('Trustline build failed');
            const { txXdr } = await res.json();

            this.setStep(2, 'active', 'Signing and submitting...');
            const tx = TransactionBuilder.fromXDR(txXdr, Networks.TESTNET);
            tx.sign(this.keypair);

            const submitRes = await fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify({ signedXdr: tx.toXDR() }),
            });
            if (!submitRes.ok) throw new Error('Transaction submission failed');
            this.setStep(2, 'done', 'USDC trustline active');
            window.localStorage.setItem(SETUP_KEY, 'true');
        } catch (err) {
            this.setStep(2, 'error', err instanceof Error ? err.message : 'Failed');
        }
    };

    reset = () => {
        this.publicKey = null;
        this.secretKey = null;
        this.keypair = null;
        window.localStorage.removeItem(SETUP_KEY);
        window.localStorage.removeItem(PUBLIC_KEY_KEY);
        window.localStorage.removeItem(SECRET_KEY_KEY);
        window.location.reload();
    };
}

export const user = new User();
