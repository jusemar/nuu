"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Calendar,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Info,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, formatDistanceStrict, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModalityCardProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  modalities: any;
  updateModality: (type: string, field: string, value: any) => void;
  updatePromo: (type: string, field: string, value: any) => void;
  togglePromo: (type: string) => void;
  isMainCard: boolean;
  onSelectMainCard: () => void;
}

// DateTimePicker component (copiado do código antigo)
const DateTimePicker = ({
  date,
  onSelect,
  placeholder = "Selecione data e hora",
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("23:59");

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      onSelect(newDate);
    } else {
      onSelect(selectedDate);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (date) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      onSelect(newDate);
    } else if (time) {
      const today = new Date();
      const [hours, minutes] = time.split(":").map(Number);
      today.setHours(hours, minutes, 0, 0);
      onSelect(today);
    }
  };

  useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [date]);

  const timeOptions = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

  return (
    <div className="flex w-full gap-2">
      <div className="min-w-0 flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 w-full min-w-[120px] justify-between text-sm font-normal"
            >
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
              <Calendar className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              locale={ptBR}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-w-0 flex-1">
        <Select value={selectedTime} onValueChange={handleTimeChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export function ModalityCard({
  type,
  label,
  icon,
  description,
  modalities,
  updateModality,
  updatePromo,
  togglePromo,
  isMainCard,
  onSelectMainCard,
}: ModalityCardProps) {
  const currentModality = modalities?.[type];
  const isPromoActive = currentModality?.promo?.active || false;
  const tipoPromocao = currentModality?.promo?.type || "normal";
  const precoPromocional = currentModality?.promo?.price;
  const validadePromocao = currentModality?.promo?.endDate;
  const dataValidadePromocao = validadePromocao
    ? new Date(validadePromocao)
    : null;
  const isPromocaoRelampago = tipoPromocao === "flash";
  const isOfertaRelampagoExpirada =
    isPromocaoRelampago && dataValidadePromocao
      ? isPast(dataValidadePromocao)
      : false;
  const tempoRestanteOfertaRelampago =
    isPromocaoRelampago && dataValidadePromocao && !isOfertaRelampagoExpirada
      ? formatDistanceStrict(dataValidadePromocao, new Date(), {
          locale: ptBR,
          addSuffix: true,
        })
      : null;

  return (
    <Card
      className={`border-gray-200 transition-colors hover:border-gray-300 ${
        isMainCard ? "border-blue-300 ring-2 ring-blue-500" : ""
      }`}
    >
      <CardContent className="p-4">
        {/* Header - Com Seleção de Preço Principal */}
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-1 shrink-0 rounded-lg border border-blue-100 bg-blue-50 p-2">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {label}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              </div>

              {/* ✅ RADIO BUTTON PARA SELEÇÃO PRINCIPAL */}
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {isMainCard && (
                  <Badge
                    variant="default"
                    className="bg-blue-600 text-xs text-white"
                  >
                    <Crown className="mr-1 h-3 w-3" />
                    Principal
                  </Badge>
                )}

                <RadioGroup value={isMainCard ? type : ""}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={type}
                      id={`main-card-${type}`}
                      onClick={onSelectMainCard}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor={`main-card-${type}`}>Card principal</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Campos de Preço e Prazo - Sempre Visíveis */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Preço de Venda
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500">
                R$
              </span>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={currentModality?.price || ""}
                onChange={(e) => updateModality(type, "price", e.target.value)}
                className="h-10 border-gray-300 pl-8 text-sm focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Prazo de Entrega
            </Label>
            <Input
              placeholder="Ex: 2-3 dias p/ entrega"
              value={currentModality?.deliveryText || ""}
              onChange={(e) =>
                updateModality(type, "deliveryText", e.target.value)
              }
              className="h-10 border-gray-300 text-sm focus:border-blue-500"
            />
          </div>
        </div>

        {/* Seção de Promoção - Controlada apenas pelo Switch */}
        <div className="border-t pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap
                className={`h-4 w-4 ${isPromoActive ? "text-orange-500" : "text-gray-400"}`}
              />
              <Label
                className="cursor-pointer text-sm font-medium text-gray-700"
                onClick={() => togglePromo(type)}
              >
                Promoção
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPromoActive}
                onCheckedChange={() => togglePromo(type)}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>

          {/* Conteúdo da Promoção - Visível apenas quando ativa */}
          {isPromoActive && (
            <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
              <div
                className={`rounded-lg border p-3 text-sm ${
                  isPromocaoRelampago
                    ? isOfertaRelampagoExpirada
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-orange-300 bg-orange-100 text-orange-900"
                    : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {isPromocaoRelampago ? (
                    isOfertaRelampagoExpirada ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-orange-600" />
                    )
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  )}

                  <Badge
                    className={
                      isPromocaoRelampago
                        ? isOfertaRelampagoExpirada
                          ? "bg-red-600 text-white"
                          : "bg-gradient-to-r from-red-600 to-orange-500 text-white"
                        : "bg-blue-600 text-white"
                    }
                  >
                    {isPromocaoRelampago ? "Relâmpago" : "Promoção normal"}
                  </Badge>

                  <span className="font-semibold">
                    {isPromocaoRelampago
                      ? isOfertaRelampagoExpirada
                        ? "Oferta expirada"
                        : "Oferta relâmpago ativa"
                      : "Promoção ativa"}
                  </span>
                </div>

                <div className="grid gap-1 text-xs">
                  <p>
                    Preço promocional:{" "}
                    <strong>
                      {precoPromocional
                        ? `R$ ${precoPromocional}`
                        : "não informado"}
                    </strong>
                  </p>

                  {isPromocaoRelampago ? (
                    <>
                      <p>
                        Validade:{" "}
                        <strong>
                          {validadePromocao
                            ? format(
                                dataValidadePromocao as Date,
                                "dd/MM/yyyy 'às' HH:mm",
                                {
                                  locale: ptBR,
                                },
                              )
                            : "não informada"}
                        </strong>
                      </p>

                      {tempoRestanteOfertaRelampago && (
                        <p>
                          Tempo restante:{" "}
                          <strong>{tempoRestanteOfertaRelampago}</strong>
                        </p>
                      )}

                      {isOfertaRelampagoExpirada ? (
                        <p className="font-medium text-red-700">
                          Esta oferta não aparece mais na home e o preço
                          relâmpago não será usado.
                        </p>
                      ) : (
                        <p className="font-medium text-orange-800">
                          A oferta relâmpago aparece na home com contador até
                          este horário.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      Esta promoção aparece no carrossel lateral de promoções da
                      home.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo de Promoção
                </Label>
                <RadioGroup
                  value={currentModality?.promo?.type || "normal"}
                  onValueChange={(value) => updatePromo(type, "type", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id={`${type}-normal`} />
                    <Label
                      htmlFor={`${type}-normal`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700"
                      >
                        Normal
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flash" id={`${type}-flash`} />
                    <Label
                      htmlFor={`${type}-flash`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      <Badge
                        variant="outline"
                        className="border-orange-200 bg-orange-50 text-orange-700"
                      >
                        Relâmpago
                      </Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Preço Promocional
                  </Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-gray-500">
                      R$
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={currentModality?.promo?.price || ""}
                      onChange={(e) =>
                        updatePromo(type, "price", e.target.value)
                      }
                      className="h-10 border-orange-300 pl-8 text-sm focus:border-orange-500"
                    />
                  </div>
                </div>

                {isPromocaoRelampago && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Validade da Oferta Relâmpago
                    </Label>
                    <DateTimePicker
                      date={currentModality?.promo?.endDate}
                      onSelect={(date) => updatePromo(type, "endDate", date)}
                    />
                    <div className="rounded-md border border-orange-200 bg-white p-3 text-xs text-gray-700">
                      <div className="mb-1 flex items-center gap-1 font-medium text-orange-800">
                        <Info className="h-3.5 w-3.5" />
                        Regra da oferta relâmpago
                      </div>
                      <p>
                        A oferta relâmpago aparece na home com contador até este
                        horário. Depois de expirada, ela deixa de aparecer na
                        home e o preço relâmpago não será mais usado.
                      </p>
                    </div>
                    {currentModality?.promo?.endDate && (
                      <p className="mt-1 text-xs text-gray-600">
                        Oferta relâmpago válida até{" "}
                        {format(
                          dataValidadePromocao as Date,
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
