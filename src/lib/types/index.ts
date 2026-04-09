import { Horizon } from '@stellar/stellar-sdk';

export interface Demo {
    num: number;
    paid: boolean;
    title: string;
    link: '/free' | '/mpp' | '/chat';
    titleColor: string;
    description: string;
}

export type Balance = Horizon.HorizonApi.BalanceLineAsset | Horizon.HorizonApi.BalanceLineNative;
