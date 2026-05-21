// src/app/admin/products/new/components/tabs/SellerTab.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormData } from "../../data/product-form-data";

type SellerTabProps = {
  data?: ProductFormData;
  onChange?: (updates: Partial<ProductFormData>) => void;
};

export function SellerTab({ data, onChange }: SellerTabProps) {
  const seller = data?.seller || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Vendedor</CardTitle>
        <CardDescription>Dados do fornecedor ou vendedor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sellerCode">Código do Vendedor</Label>
            <Input
              id="sellerCode"
              placeholder="Código único do fornecedor"
              value={seller.sellerCode || ""}
              onChange={(event) =>
                onChange?.({
                  seller: { ...seller, sellerCode: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalCode">Código Interno</Label>
            <Input
              id="internalCode"
              placeholder="Seu código interno"
              value={seller.internalCode || ""}
              onChange={(event) =>
                onChange?.({
                  seller: { ...seller, internalCode: event.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellerInfo">Informações do Fornecedor</Label>
          <Input
            id="sellerInfo"
            placeholder="Nome do fornecedor ou vendedor"
            value={seller.sellerInfo || ""}
            onChange={(event) =>
              onChange?.({
                seller: { ...seller, sellerInfo: event.target.value },
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
