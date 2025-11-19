/**
 * @file: offers.ts
 * @description: Типы для системы оферт
 * @dependencies: none
 * @created: 2024-12-19
 */
export interface Offer {
    id: string;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface CreateOfferRequest {
    title: string;
    content: string;
    version: string;
}
export interface UpdateOfferRequest {
    title?: string;
    content?: string;
    version?: string;
}
export interface OfferFilters {
    is_active?: boolean;
    version?: string;
    created_by?: string;
}
//# sourceMappingURL=offers.d.ts.map