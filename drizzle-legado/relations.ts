import { relations } from "drizzle-orm/relations";
import { category, product, user, account, session, cart, shippingAddress, productVariant, cartItem, productPricing, states, cities, order, orderItem, neighborhoods, productDeliveryMethods, deliveryMethods, productSuppliers, suppliers, bairrosAvulsos, shippingBairroAvulsoSlots, shippingRegions, shippingRegionSlots, productVariantImage, productImage, productAttribute, productGalleryImages, regiaoBairros, produtoRetirada, pontosColeta, prazosRetirada } from "./schema";

export const productRelations = relations(product, ({one, many}) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	productVariants: many(productVariant),
	productPricings: many(productPricing),
	productDeliveryMethods: many(productDeliveryMethods),
	productSuppliers: many(productSuppliers),
	productAttributes: many(productAttribute),
	productGalleryImages: many(productGalleryImages),
	produtoRetiradas: many(produtoRetirada),
}));

export const categoryRelations = relations(category, ({many}) => ({
	products: many(product),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	carts: many(cart),
	shippingAddresses: many(shippingAddress),
	orders: many(order),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const cartRelations = relations(cart, ({one, many}) => ({
	user: one(user, {
		fields: [cart.userId],
		references: [user.id]
	}),
	shippingAddress: one(shippingAddress, {
		fields: [cart.shippingAddressId],
		references: [shippingAddress.id]
	}),
	cartItems: many(cartItem),
}));

export const shippingAddressRelations = relations(shippingAddress, ({one, many}) => ({
	carts: many(cart),
	user: one(user, {
		fields: [shippingAddress.userId],
		references: [user.id]
	}),
	orders: many(order),
}));

export const productVariantRelations = relations(productVariant, ({one, many}) => ({
	product: one(product, {
		fields: [productVariant.productId],
		references: [product.id]
	}),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
	productVariantImages: many(productVariantImage),
	productImages: many(productImage),
}));

export const cartItemRelations = relations(cartItem, ({one}) => ({
	cart: one(cart, {
		fields: [cartItem.cartId],
		references: [cart.id]
	}),
	productVariant: one(productVariant, {
		fields: [cartItem.productVariantId],
		references: [productVariant.id]
	}),
}));

export const productPricingRelations = relations(productPricing, ({one}) => ({
	product: one(product, {
		fields: [productPricing.productId],
		references: [product.id]
	}),
}));

export const citiesRelations = relations(cities, ({one, many}) => ({
	state: one(states, {
		fields: [cities.stateUf],
		references: [states.uf]
	}),
	neighborhoods: many(neighborhoods),
}));

export const statesRelations = relations(states, ({many}) => ({
	cities: many(cities),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	shippingAddress: one(shippingAddress, {
		fields: [order.shippingAddressId],
		references: [shippingAddress.id]
	}),
	orderItems: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
	productVariant: one(productVariant, {
		fields: [orderItem.productVariantId],
		references: [productVariant.id]
	}),
}));

export const neighborhoodsRelations = relations(neighborhoods, ({one}) => ({
	city: one(cities, {
		fields: [neighborhoods.cityId],
		references: [cities.id]
	}),
}));

export const productDeliveryMethodsRelations = relations(productDeliveryMethods, ({one}) => ({
	product: one(product, {
		fields: [productDeliveryMethods.productId],
		references: [product.id]
	}),
	deliveryMethod: one(deliveryMethods, {
		fields: [productDeliveryMethods.deliveryMethodId],
		references: [deliveryMethods.id]
	}),
}));

export const deliveryMethodsRelations = relations(deliveryMethods, ({many}) => ({
	productDeliveryMethods: many(productDeliveryMethods),
}));

export const productSuppliersRelations = relations(productSuppliers, ({one}) => ({
	product: one(product, {
		fields: [productSuppliers.productId],
		references: [product.id]
	}),
	supplier: one(suppliers, {
		fields: [productSuppliers.supplierId],
		references: [suppliers.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	productSuppliers: many(productSuppliers),
}));

export const shippingBairroAvulsoSlotsRelations = relations(shippingBairroAvulsoSlots, ({one}) => ({
	bairrosAvulso: one(bairrosAvulsos, {
		fields: [shippingBairroAvulsoSlots.bairroAvulsoId],
		references: [bairrosAvulsos.id]
	}),
}));

export const bairrosAvulsosRelations = relations(bairrosAvulsos, ({many}) => ({
	shippingBairroAvulsoSlots: many(shippingBairroAvulsoSlots),
}));

export const shippingRegionSlotsRelations = relations(shippingRegionSlots, ({one}) => ({
	shippingRegion: one(shippingRegions, {
		fields: [shippingRegionSlots.regionId],
		references: [shippingRegions.id]
	}),
}));

export const shippingRegionsRelations = relations(shippingRegions, ({many}) => ({
	shippingRegionSlots: many(shippingRegionSlots),
	regiaoBairros: many(regiaoBairros),
}));

export const productVariantImageRelations = relations(productVariantImage, ({one}) => ({
	productVariant: one(productVariant, {
		fields: [productVariantImage.variantId],
		references: [productVariant.id]
	}),
}));

export const productImageRelations = relations(productImage, ({one}) => ({
	productVariant: one(productVariant, {
		fields: [productImage.productVariantId],
		references: [productVariant.id]
	}),
}));

export const productAttributeRelations = relations(productAttribute, ({one}) => ({
	product: one(product, {
		fields: [productAttribute.productId],
		references: [product.id]
	}),
}));

export const productGalleryImagesRelations = relations(productGalleryImages, ({one}) => ({
	product: one(product, {
		fields: [productGalleryImages.productId],
		references: [product.id]
	}),
}));

export const regiaoBairrosRelations = relations(regiaoBairros, ({one}) => ({
	shippingRegion: one(shippingRegions, {
		fields: [regiaoBairros.regiaoId],
		references: [shippingRegions.id]
	}),
}));

export const produtoRetiradaRelations = relations(produtoRetirada, ({one}) => ({
	product: one(product, {
		fields: [produtoRetirada.productId],
		references: [product.id]
	}),
	pontosColeta: one(pontosColeta, {
		fields: [produtoRetirada.pontoColetaId],
		references: [pontosColeta.id]
	}),
	prazosRetirada: one(prazosRetirada, {
		fields: [produtoRetirada.modalidadeId],
		references: [prazosRetirada.id]
	}),
}));

export const pontosColetaRelations = relations(pontosColeta, ({many}) => ({
	produtoRetiradas: many(produtoRetirada),
}));

export const prazosRetiradaRelations = relations(prazosRetirada, ({many}) => ({
	produtoRetiradas: many(produtoRetirada),
}));