// Discount and Promotion Management Module for SPECTRE POS
// Handles product discounts, cart discounts, and promo codes

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[discount-system.js] supabaseClient not initialized. Ensure auth.js is loaded before discount-system.js');
}

/**
 * Create a discount/promotion
 * @param {Object} discountData - Discount data
 * @returns {Promise<Object>} Created discount record
 */
async function createDiscount(discountData) {
    try {
        const { data, error } = await supabaseClient
            .from('discounts')
            .insert([{
                name: discountData.name,
                type: discountData.type, // 'percentage', 'fixed', 'buy_x_get_y'
                value: discountData.value,
                min_purchase: discountData.min_purchase || 0,
                max_discount: discountData.max_discount || null,
                applicable_products: discountData.applicable_products || null, // null = all products
                applicable_categories: discountData.applicable_categories || null, // null = all categories
                promo_code: discountData.promo_code || null,
                start_date: discountData.start_date,
                end_date: discountData.end_date,
                max_uses: discountData.max_uses || null,
                member_only: discountData.member_only || false,
                active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating discount:', error);
        throw error;
    }
}

/**
 * Get all active discounts
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Discounts list
 */
async function getActiveDiscounts(filters = {}) {
    try {
        let query = supabaseClient
            .from('discounts')
            .select('*')
            .eq('active', true);

        // Filter by date range
        const now = new Date().toISOString();
        query = query.lte('start_date', now).gte('end_date', now);

        if (filters.memberOnly) {
            query = query.eq('member_only', true);
        }

        if (filters.promoCode) {
            query = query.eq('promo_code', filters.promoCode);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting discounts:', error);
        throw error;
    }
}

/**
 * Apply discount to cart
 * @param {Array} cartItems - Cart items
 * @param {string} promoCode - Promo code (optional)
 * @param {boolean} isMember - Is customer a member
 * @returns {Promise<Object>} Applied discount info
 */
async function applyDiscount(cartItems, promoCode = null, isMember = false) {
    try {
        let totalDiscount = 0;
        let appliedDiscount = null;
        let discountDetails = [];

        // Get active discounts
        const filters = { memberOnly: isMember };
        if (promoCode) {
            filters.promoCode = promoCode;
        }

        const discounts = await getActiveDiscounts(filters);

        // Calculate cart total
        const cartTotal = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Apply each applicable discount
        for (const discount of discounts) {
            // Check if discount is applicable
            if (discount.min_purchase && cartTotal < discount.min_purchase) {
                continue; // Minimum purchase not met
            }

            if (discount.applicable_products) {
                // Check if any cart item matches applicable products
                const hasApplicableProduct = cartItems.some(item => 
                    discount.applicable_products.includes(item.product_id)
                );
                if (!hasApplicableProduct) continue;
            }

            if (discount.applicable_categories) {
                // Check if any cart item matches applicable categories
                const hasApplicableCategory = cartItems.some(item => 
                    discount.applicable_categories.includes(item.category)
                );
                if (!hasApplicableCategory) continue;
            }

            // Calculate discount amount
            let discountAmount = 0;

            if (discount.type === 'percentage') {
                discountAmount = cartTotal * (discount.value / 100);
            } else if (discount.type === 'fixed') {
                discountAmount = discount.value;
            } else if (discount.type === 'buy_x_get_y') {
                // Buy X get Y logic
                const buyQty = discount.buy_quantity || 1;
                const getQty = discount.get_quantity || 1;
                
                // Find applicable items
                const applicableItems = cartItems.filter(item => {
                    if (discount.applicable_products) {
                        return discount.applicable_products.includes(item.product_id);
                    }
                    if (discount.applicable_categories) {
                        return discount.applicable_categories.includes(item.category);
                    }
                    return true;
                });

                const totalApplicableQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
                const freeItems = Math.floor(totalApplicableQty / buyQty) * getQty;
                
                // Calculate value of free items (use cheapest item price)
                if (applicableItems.length > 0) {
                    const minPrice = Math.min(...applicableItems.map(item => item.price));
                    discountAmount = freeItems * minPrice;
                }
            }

            // Apply max discount limit
            if (discount.max_discount && discountAmount > discount.max_discount) {
                discountAmount = discount.max_discount;
            }

            // Use the highest discount
            if (discountAmount > totalDiscount) {
                totalDiscount = discountAmount;
                appliedDiscount = discount;
                discountDetails = [{
                    name: discount.name,
                    type: discount.type,
                    amount: discountAmount
                }];
            }
        }

        return {
            success: true,
            discountAmount: totalDiscount,
            appliedDiscount: appliedDiscount,
            discountDetails: discountDetails,
            finalTotal: cartTotal - totalDiscount
        };
    } catch (error) {
        console.error('Error applying discount:', error);
        return {
            success: false,
            error: error.message,
            discountAmount: 0,
            finalTotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
    }
}

/**
 * Validate promo code
 * @param {string} promoCode - Promo code to validate
 * @param {boolean} isMember - Is customer a member
 * @returns {Promise<Object>} Validation result
 */
async function validatePromoCode(promoCode, isMember = false) {
    try {
        const discounts = await getActiveDiscounts({ promoCode, memberOnly: isMember });

        if (discounts.length === 0) {
            return {
                valid: false,
                message: 'Invalid or expired promo code'
            };
        }

        const discount = discounts[0];

        // Check usage limit
        if (discount.max_uses && discount.used_count >= discount.max_uses) {
            return {
                valid: false,
                message: 'Promo code has reached maximum usage limit'
            };
        }

        return {
            valid: true,
            discount: discount,
            message: `Promo code applied: ${discount.name}`
        };
    } catch (error) {
        console.error('Error validating promo code:', error);
        return {
            valid: false,
            message: 'Error validating promo code'
        };
    }
}

/**
 * Update discount usage count
 * @param {string} discountId - Discount ID
 * @returns {Promise<boolean>} Success status
 */
async function incrementDiscountUsage(discountId) {
    try {
        // Fetch current usage count
        const { data: discount, error: fetchError } = await supabaseClient
            .from('discounts')
            .select('used_count')
            .eq('id', discountId)
            .single();
        
        if (fetchError || !discount) {
            throw fetchError || new Error('Discount not found');
        }
        
        // Increment usage count
        const newCount = (discount.used_count || 0) + 1;
        
        const { error } = await supabaseClient
            .from('discounts')
            .update({ used_count: newCount })
            .eq('id', discountId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error incrementing discount usage:', error);
        throw error;
    }
}

/**
 * Deactivate discount
 * @param {string} discountId - Discount ID
 * @returns {Promise<boolean>} Success status
 */
async function deactivateDiscount(discountId) {
    try {
        const { error } = await supabaseClient
            .from('discounts')
            .update({ active: false })
            .eq('id', discountId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deactivating discount:', error);
        throw error;
    }
}

/**
 * Get discount statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Discount statistics
 */
async function getDiscountStatistics(startDate, endDate) {
    try {
        const { data: discounts, error } = await supabaseClient
            .from('discounts')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        const totalDiscounts = discounts ? discounts.length : 0;
        const activeDiscounts = discounts ? discounts.filter(d => d.active).length : 0;
        const totalUsage = discounts ? discounts.reduce((sum, d) => sum + (d.used_count || 0), 0) : 0;

        // Discounts by type
        const discountsByType = {};
        (discounts || []).forEach(d => {
            const type = d.type || 'unknown';
            if (!discountsByType[type]) {
                discountsByType[type] = 0;
            }
            discountsByType[type]++;
        });

        return {
            totalDiscounts,
            activeDiscounts,
            totalUsage,
            discountsByType
        };
    } catch (error) {
        console.error('Error getting discount statistics:', error);
        throw error;
    }
}

// Export functions for global access
window.DiscountSystem = {
    createDiscount,
    getActiveDiscounts,
    applyDiscount,
    validatePromoCode,
    incrementDiscountUsage,
    deactivateDiscount,
    getDiscountStatistics
};
