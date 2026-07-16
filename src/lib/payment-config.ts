export const MERCHANT_NUMBERS = {
    bkash: "01319711956",
    nagad: "01319711956",
    rocket: "01319711956",
} as const;

export type PackageKey = "premium";

export const PACKAGES: Record<
    PackageKey,
    { name: string; price: number; tagline: string }
> = {
    premium: { name: "Premium", price: 179, tagline: "Monthly subscription" },
};

export const METHOD_LABELS = {
    bkash: "bKash",
    nagad: "Nagad",
    rocket: "Rocket",
} as const;
