import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCartShippingAddress } from "@/actions/update-cart-shipping-address";
import { UpdateCartShippingAddressSchema } from "@/actions/update-cart-shipping-address/schema";
import { chaveCepEnderecoCliente } from "@/features/logistica/constants/chaves-query-logistica";
import { notificarEnderecoClienteAtualizado } from "@/features/logistica/lib/cep-cliente";

import { getUseCartQueryKey } from "../queries/use-cart";

export const getUpdateCartShippingAddressMutationKey = () => [
  "update-cart-shipping-address",
];

export const useUpdateCartShippingAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUpdateCartShippingAddressMutationKey(),
    mutationFn: (data: UpdateCartShippingAddressSchema) =>
      updateCartShippingAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUseCartQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: chaveCepEnderecoCliente });
      notificarEnderecoClienteAtualizado();
    },
  });
};
