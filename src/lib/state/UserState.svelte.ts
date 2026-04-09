import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';

export type StepStatus = 'idle' | 'active' | 'done' | 'error';
export type Step = { label: string; status: StepStatus; detail: string };

const SETUP_KEY = 'mpp:demo:setupComplete';
const SECRET_KEY_KEY = 'mpp:demo:secretKey';

class User {
    secretKey: string | null = $state(null);

    steps: Record<string, Step> = $state({
        generate: { label: 'Generate keypair', status: 'idle', detail: '' },
        friendbot: { label: 'Fund with Friendbot', status: 'idle', detail: '' },
        trustline: { label: 'Create USDC trustline', status: 'idle', detail: '' },
    });

    keypair = $derived(this.secretKey ? Keypair.fromSecret(this.secretKey) : null);
    publicKey = $derived(this.keypair ? this.keypair.publicKey() : null);
    isLoading = $derived(Object.values(this.steps).some((s) => s.status === 'active'));
    isComplete = $derived(Object.values(this.steps).every((s) => s.status === 'done'));
    hasError = $derived(Object.values(this.steps).some((s) => s.status === 'error'));

    constructor() {
        if (Object.hasOwn(window.localStorage, SECRET_KEY_KEY)) {
            this.secretKey = window.localStorage.getItem(SECRET_KEY_KEY);
        }
    }

    /** True if setup previously completed successfully. */
    get alreadySetUp(): boolean {
        return window.localStorage.getItem(SETUP_KEY) === 'true' && !!this.publicKey;
    }

    set = (secretKey: string) => {
        this.secretKey = secretKey;
        window.localStorage.setItem(SECRET_KEY_KEY, secretKey);
    };

    private setStep(key: string, status: StepStatus, detail = '') {
        this.steps[key] = { ...this.steps[key], status, detail };
    }

    setup = async () => {
        if (this.isLoading) return;

        // Step 1: Generate keypair
        this.setStep('generate', 'active', 'Generating...');
        if (!this.secretKey) {
            const kp = Keypair.random();
            this.set(kp.secret());
        }

        this.setStep('generate', 'done', this.publicKey!.slice(0, 8) + '...');

        // Step 2: Friendbot
        this.setStep('friendbot', 'active', 'Requesting testnet XLM...');
        try {
            const res = await fetch('/api/faucet?step=friendbot', {
                method: 'POST',
                body: JSON.stringify({ publicKey: this.publicKey }),
            });
            if (!res.ok) throw new Error('Friendbot request failed');
            const data = await res.json();
            this.setStep('friendbot', 'done', `Funded (tx: ${data.hash?.slice(0, 8)}...)`);
        } catch (err) {
            this.setStep('friendbot', 'error', err instanceof Error ? err.message : 'Failed');
            return;
        }

        // Step 3: Trustline
        this.setStep('trustline', 'active', 'Building trustline transaction...');
        try {
            const res = await fetch('/api/faucet?step=trustline', {
                method: 'POST',
                body: JSON.stringify({ publicKey: this.publicKey }),
            });
            if (!res.ok) throw new Error('Trustline build failed');
            const { txXdr } = await res.json();

            this.setStep('trustline', 'active', 'Signing and submitting...');
            const tx = TransactionBuilder.fromXDR(txXdr, Networks.TESTNET);
            tx.sign(this.keypair!);

            const submitRes = await fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify({ signedXdr: tx.toXDR() }),
            });
            if (!submitRes.ok) throw new Error('Transaction submission failed');
            this.setStep('trustline', 'done', 'USDC trustline active');
            window.localStorage.setItem(SETUP_KEY, 'true');
        } catch (err) {
            this.setStep('trustline', 'error', err instanceof Error ? err.message : 'Failed');
        }
    };

    reset = () => {
        this.secretKey = null;
        window.localStorage.removeItem(SETUP_KEY);
        window.localStorage.removeItem(SECRET_KEY_KEY);
        window.location.reload();
    };
}

export const user = new User();
