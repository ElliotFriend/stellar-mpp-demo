// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    // Web Speech API types (not included in all TS DOM libs)
    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }

    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onend: (() => void) | null;
        onerror: ((event: Event) => void) | null;
        start(): void;
        stop(): void;
        abort(): void;
    }

    declare const SpeechRecognition: {
        new (): SpeechRecognition;
        prototype: SpeechRecognition;
    };

    interface Window {
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;
    }
}

export {};
