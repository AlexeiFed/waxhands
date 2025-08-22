/**
 * @file: about.ts
 * @description: Типы для таблиц about и about_media
 * @dependencies: -
 * @created: 2024-12-19
 */
export interface AboutContent {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    mission: string;
    vision: string;
    values: string;
    contact_info: string;
    created_at: string;
    updated_at: string;
}
export interface AboutMedia {
    id: number;
    filename: string;
    original_name: string;
    type: 'image' | 'video';
    title: string;
    description?: string;
    order_index: number;
    file_path: string;
    created_at: string;
    updated_at: string;
}
export interface CreateAboutContentRequest {
    title?: string;
    subtitle?: string;
    description?: string;
    mission?: string;
    vision?: string;
    values?: string;
    contact_info?: string;
}
export interface CreateAboutMediaRequest {
    filename: string;
    original_name: string;
    type: 'image' | 'video';
    title: string;
    description?: string;
    order_index?: number;
    file_path: string;
}
export interface UpdateAboutContentRequest extends Partial<CreateAboutContentRequest> {
}
export interface UpdateAboutMediaRequest extends Partial<CreateAboutMediaRequest> {
}
//# sourceMappingURL=about.d.ts.map