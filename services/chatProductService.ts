import { api, API_BASE_URL } from './api';

/**
 * Website-chat product images.
 *
 * Upload:  POST /tenants/{tenantId}/chat-products/images   (multipart field `file`, authenticated)
 *          -> { image_id: "<32 hex>.<png|jpg|webp>" }
 * Serve:   GET  /tenants/{tenantId}/chat-products/images/{imageId}   (public, 302 to a presigned S3 URL)
 */

/** Uploads a product image (PNG/JPG/WebP, ≤ 2 MB — enforced by the backend) and returns its id. */
export const uploadChatProductImage = async (tenantId: string, file: File): Promise<{ imageId: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // The api request interceptor drops the JSON Content-Type for FormData so axios sets the multipart boundary.
    const res = await api.post<{ image_id: string }>(
        `/tenants/${encodeURIComponent(tenantId)}/chat-products/images`,
        formData
    );

    const imageId = res.data?.image_id;
    if (typeof imageId !== 'string' || !imageId) {
        throw new Error('Upload succeeded but no image id was returned');
    }
    return { imageId };
};

/** Public URL for a product image, usable directly in an <img src>. */
export const getChatProductImageUrl = (tenantId: string, imageId: string): string =>
    `${API_BASE_URL.replace(/\/+$/, '')}/tenants/${encodeURIComponent(tenantId)}/chat-products/images/${encodeURIComponent(imageId)}`;
