import React, { useState } from 'react';
import { Package } from 'lucide-react';
import type { ChatProductCard } from '../../types';
import { getChatProductImageUrl } from '../../services/chatProductService';

interface ProductCardsProps {
    tenantId: string;
    products: ChatProductCard[];
    /** Visitor tapped a product's button. */
    onSelect: (product: ChatProductCard) => void;
    /** No new messages can be sent (reply in progress or chat ended). */
    disabled?: boolean;
}

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-le-accent';

/** Image area: the uploaded product image, or a soft theme-tinted placeholder when there is none (or it fails to load). */
const ProductImage: React.FC<{ tenantId: string; product: ChatProductCard }> = ({ tenantId, product }) => {
    const [failed, setFailed] = useState(false);
    const showImage = !!product.imageId && !failed;

    return (
        <div className="relative h-[120px] overflow-hidden rounded-[13px] bg-gradient-to-br from-le-tint-1 to-le-tint-2">
            {showImage ? (
                <img
                    src={getChatProductImageUrl(tenantId, product.imageId!)}
                    alt={product.title}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
                    <Package className="h-[34px] w-[34px] text-le-link" strokeWidth={1.3} />
                </div>
            )}
        </div>
    );
};

/** Horizontally scrolling product cards under a bot message (Recommend design). */
const ProductCards: React.FC<ProductCardsProps> = ({ tenantId, products, onSelect, disabled }) => {
    if (!products.length) return null;

    return (
        <div
            role="list"
            aria-label="Products"
            className="-mr-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {products.map((product, index) => (
                <article
                    key={product.productId}
                    role="listitem"
                    className="w-[208px] flex-none snap-start rounded-[18px] border border-white/95 bg-white/80 p-2 shadow-le-card"
                >
                    <ProductImage tenantId={tenantId} product={product} />
                    <div className="px-1.5 pb-1 pt-2.5">
                        <h3 className="text-sm font-medium text-le-ink">{product.title}</h3>
                        {product.description && (
                            <p className="mt-0.5 line-clamp-3 text-xs leading-[1.4] text-le-muted">{product.description}</p>
                        )}
                        <button
                            type="button"
                            onClick={() => onSelect(product)}
                            disabled={disabled}
                            aria-label={`I'm interested in ${product.title}`}
                            className={`mt-2.5 flex h-8 w-full items-center justify-center rounded-full text-[13px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
                                index === 0
                                    ? 'bg-le-btn text-le-on-btn hover:opacity-95'
                                    : 'border border-le-border bg-white text-le-selected-text hover:bg-le-selected-bg'
                            }`}
                        >
                            I'm interested
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
};

export default ProductCards;
