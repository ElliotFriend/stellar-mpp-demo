#!/usr/bin/env vite-node --script

import { Keypair } from '@stellar/stellar-sdk';
import { Mppx } from 'mppx/client';
import { stellar } from '@stellar/mpp/charge/client';

// import { STELLAR_SECRET } from "$env/static/private";

const STELLAR_SECRET = process.env.STELLAR_SECRET;
if (!STELLAR_SECRET) {
    throw new Error('missing stellar secret');
}
const keypair = Keypair.fromSecret(STELLAR_SECRET);
console.log(`Using Stellar account: ${keypair.publicKey()}`);

// Polyfill global fetch — 402 responses are handled automatically
Mppx.create({
    methods: [
        stellar.charge({
            keypair,
            mode: 'pull', // server broadcasts the signed transaction
            onProgress(event) {
                console.log(`[${event.type}]`, event);
            },
        }),
    ],
});

// Make the request — payment is handled transparently on 402
// const response = await fetch(`http://localhost:${process.env.PORT ?? 3001}/my-service`);
const response = await fetch('http://localhost:5173/api/paid/pull/quotes');
const data = await response.json();

console.log(`Response (${response.status}):`, data);
