"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetOwnerProductSaleSlipUrl,
  getGetStaffProductSaleSlipUrl,
  getGetStaffSaleProductImageUrl,
  getListOwnerProductSalesQueryKey,
  getListStaffProductSalesQueryKey,
  getListStaffSaleProductsQueryKey,
  useCreateStaffProductSale,
  useListOwnerProductSales,
  useListStaffProductSales,
  useListStaffSaleProducts,
  useVoidStaffProductSale,
  type QuickSale,
  type QuickSaleInputPaymentMethod,
  type QuickSaleProduct,
} from "@workspace/api-client-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { Label } from "@workspace/jaguar-spk-design-system/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/jaguar-spk-design-system/components/ui/dialog";
import { toast } from "@workspace/jaguar-spk-design-system/hooks/use-toast";
import { uploadPrivateImage } from "@/components/brand/private-upload";
import { EmptyState, ErrorState, LoadingState } from "@/components/brand/ui";
import { errorText } from "@/components/brand/loyalty-api";

type CartEntry = { product: QuickSaleProduct; quantity: number };
type PaymentMethod = QuickSaleInputPaymentMethod;

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "เงินสด",
  transfer: "โอน",
  other: "อื่น ๆ",
};

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function money(amount: number) {
  return `฿${amount.toLocaleString("th-TH")}`;
}

function saleTime(createdAt: string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function StaffProductSales() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(bangkokDate);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPath, setSlipPath] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const [voidTarget, setVoidTarget] = useState<QuickSale | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const requestRef = useRef<{ signature: string; id: string } | null>(null);
  const slipInputRef = useRef<HTMLInputElement>(null);

  const productsKey = getListStaffSaleProductsQueryKey();
  const products = useListStaffSaleProducts({
    query: { queryKey: productsKey, retry: false },
  });
  const salesParams = useMemo(() => ({ date }), [date]);
  const salesKey = getListStaffProductSalesQueryKey(salesParams);
  const sales = useListStaffProductSales(salesParams, {
    query: { queryKey: salesKey, retry: false },
  });
  const createSale = useCreateStaffProductSale();
  const voidSale = useVoidStaffProductSale();
  const availableProducts = products.data ?? [];
  const categories = useMemo(() => [...new Set(availableProducts.map((product) => product.category))], [availableProducts]);
  const visibleProducts = useMemo(
    () => categoryFilter ? availableProducts.filter((product) => product.category === categoryFilter) : availableProducts,
    [availableProducts, categoryFilter],
  );
  const total = cart.reduce((sum, row) => sum + row.product.price_baht * row.quantity, 0);

  const changeQuantity = (product: QuickSaleProduct, delta: number) => {
    setCart((current) => {
      const match = current.find((row) => row.product.id === product.id);
      if (!match && delta > 0) return current.length >= 30 ? current : [...current, { product, quantity: 1 }];
      if (match && delta > 0 && match.quantity >= 999) return current;
      return current
        .map((row) => row.product.id === product.id
          ? { ...row, quantity: Math.min(999, row.quantity + delta) }
          : row)
        .filter((row) => row.quantity > 0);
    });
    setFormError("");
  };

  const submitSale = async (event: FormEvent) => {
    event.preventDefault();
    if (!cart.length) {
      setFormError("เพิ่มสินค้าอย่างน้อย 1 รายการก่อนบันทึก");
      return;
    }
    if (total > 100_000_000) {
      setFormError("ยอดรวมต่อบิลต้องไม่เกิน 100,000,000 บาท");
      return;
    }
    setFormError("");
    setUploadError("");
    let uploadedPath = slipPath;
    if (slipFile && !uploadedPath) {
      setUploadingSlip(true);
      try {
        uploadedPath = await uploadPrivateImage(slipFile, "sale_slip");
        setSlipPath(uploadedPath);
      } catch (error) {
        const message = errorText(error);
        setUploadError(message);
        setFormError(message);
        toast({ title: "อัปโหลดสลิปไม่สำเร็จ", description: message, variant: "destructive" });
        return;
      } finally {
        setUploadingSlip(false);
      }
    }
    try {
      const signature = JSON.stringify([
        paymentMethod,
        cart.map(({ product, quantity }) => [product.id, quantity]),
        uploadedPath,
      ]);
      const request = requestRef.current?.signature === signature
        ? requestRef.current
        : { signature, id: crypto.randomUUID() };
      requestRef.current = request;
      const sale = await createSale.mutateAsync({
        data: {
          request_id: request.id,
          payment_method: paymentMethod,
          items: cart.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
          slip_path: uploadedPath,
        },
      });
      requestRef.current = null;
      setCart([]);
      setDate(bangkokDate());
      setSlipFile(null);
      setSlipPath(null);
      if (slipInputRef.current) slipInputRef.current.value = "";
      setPaymentMethod("cash");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListStaffSaleProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListStaffProductSalesQueryKey() }),
      ]);
      const shortages = sale.items.filter((item) => item.stock_shortage_quantity > 0);
      toast({
        title: "บันทึกการขายสำเร็จ",
        description: shortages.length
          ? `${money(sale.amount_baht)} · ตัดสต็อกได้ถึงศูนย์เท่านั้น ต้องตรวจนับสต็อกอีกครั้ง`
          : `${money(sale.amount_baht)} · ${sale.items.length} รายการ`,
      });
    } catch (error) {
      const message = errorText(error);
      setFormError(message);
      toast({ title: "บันทึกไม่สำเร็จ", description: message, variant: "destructive" });
    }
  };

  const submitVoid = async (event: FormEvent) => {
    event.preventDefault();
    if (!voidTarget || voidReason.trim().length < 3) return;
    try {
      await voidSale.mutateAsync({
        id: voidTarget.id,
        data: { reason: voidReason.trim() },
      });
      setVoidTarget(null);
      setVoidReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListStaffSaleProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListStaffProductSalesQueryKey() }),
      ]);
      toast({ title: "ยกเลิกรายการแล้ว", description: "เหตุผลการยกเลิกถูกบันทึกในประวัติ" });
    } catch (error) {
      toast({ title: "ยกเลิกรายการไม่สำเร็จ", description: errorText(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5" data-testid="staff-product-sales">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Product counter · ไม่สะสมแต้ม</p>
          <h2 className="font-display text-2xl font-semibold">ขายสินค้า</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">บันทึกการซื้อทั่วไปโดยไม่ต้องใช้รหัสสมาชิก</p>
        </div>
        <div className="field min-w-44">
          <Label htmlFor="staff-product-sales-date">ประวัติวันที่ (เวลาไทย)</Label>
          <Input id="staff-product-sales-date" data-testid="input-staff-product-sales-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </header>

      <form onSubmit={(event) => void submitSale(event)} className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className="panel p-4 sm:p-5" aria-labelledby="product-catalog-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><p className="eyebrow">Active catalog</p><h3 id="product-catalog-title" className="font-display text-lg font-semibold">เลือกสินค้า</h3></div>
            <span className="chip">{availableProducts.length} รายการ</span>
          </div>
          {products.isLoading ? <LoadingState label="กำลังโหลดสินค้าและราคาปัจจุบัน" compact />
            : products.isError ? <ErrorState message={errorText(products.error)} onRetry={() => void products.refetch()} retrying={products.isFetching} />
              : !availableProducts.length ? <EmptyState title="ไม่มีสินค้าเปิดขายในขณะนี้" />
                : <>
                  <div className="field mb-3">
                    <Label htmlFor="staff-sale-category">หมวดสินค้า</Label>
                    <select id="staff-sale-category" className="input" value={categoryFilter} data-testid="select-sale-category" onChange={(event) => setCategoryFilter(event.target.value)}>
                      <option value="">ทุกหมวด</option>
                      {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 list-none p-0">
                  {visibleProducts.map((product) => {
                    const inCart = cart.find((row) => row.product.id === product.id)?.quantity ?? 0;
                    const outOfStock = product.stock_quantity === 0;
                    return <li key={product.id}>
                      <article className="h-full rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3" data-testid={`card-sale-product-${product.id}`}>
                        <div className="flex gap-3">
                          {product.has_image
                            ? <img src={getGetStaffSaleProductImageUrl(encodeURIComponent(product.id))} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                            : <div aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-xs text-[var(--muted)]">สินค้า</div>}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-snug">{product.name}</p>
                            <p className="text-xs text-[var(--muted)]">{product.category}</p>
                            <p className="mt-1 font-mono text-sm text-[var(--gold-2)]">{money(product.price_baht)}</p>
                            <p className="text-xs text-[var(--muted)]">{product.stock_quantity === null
                              ? "ไม่ติดตามสต็อก"
                              : `คงเหลือ ${product.stock_quantity.toLocaleString("th-TH")} ${product.stock_unit ?? "ชิ้น"}`}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-sm" aria-live="polite">{inCart ? `ในตะกร้า ${inCart}` : outOfStock ? "สต็อกเป็นศูนย์ · บันทึกขายได้" : "พร้อมขาย"}</span>
                          <Button type="button" size="sm" variant="outline" disabled={inCart >= 999 || (!inCart && cart.length >= 30)} data-testid={`button-add-sale-product-${product.id}`} onClick={() => changeQuantity(product, 1)}>
                            {inCart ? "เพิ่มอีก" : "เพิ่ม"}
                          </Button>
                        </div>
                      </article>
                    </li>;
                  })}
                  </ul>
                  {cart.length >= 30 && <p className="mt-2 text-xs text-[var(--muted)]" role="status">บิลหนึ่งเลือกสินค้าได้สูงสุด 30 รายการ</p>}
                </>}
        </section>

        <section className="panel p-4 sm:p-5" aria-labelledby="sale-cart-title">
          <div className="mb-4"><p className="eyebrow">Current sale</p><h3 id="sale-cart-title" className="font-display text-lg font-semibold">ตะกร้าขาย</h3></div>
          {!cart.length ? <div className="rounded-xl border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--muted)]">เลือกสินค้าจากรายการเพื่อเริ่มตะกร้า</div>
            : <ul className="mb-4 divide-y divide-[var(--line)] list-none p-0">
              {cart.map(({ product, quantity }) => <li key={product.id} className="flex items-center gap-3 py-3" data-testid={`row-cart-product-${product.id}`}>
                <div className="min-w-0 flex-1"><p className="font-medium">{product.name}</p><p className="text-xs text-[var(--muted)]">{money(product.price_baht)} × {quantity} = {money(product.price_baht * quantity)}</p></div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label={`ลดจำนวน ${product.name}`} data-testid={`button-decrease-${product.id}`} onClick={() => changeQuantity(product, -1)}>−</Button>
                  <span className="w-7 text-center font-mono" aria-label={`จำนวน ${quantity}`}>{quantity}</span>
                  <Button type="button" variant="outline" size="icon" disabled={quantity >= 999} aria-label={`เพิ่มจำนวน ${product.name}`} data-testid={`button-increase-${product.id}`} onClick={() => changeQuantity(product, 1)}>+</Button>
                </div>
              </li>)}
            </ul>}
          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-medium">วิธีชำระเงิน</legend>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="วิธีชำระเงิน">
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => <Button key={method} type="button" variant={paymentMethod === method ? "secondary" : "outline"} className="min-h-11 px-2" aria-pressed={paymentMethod === method} data-testid={`button-payment-${method}`} onClick={() => setPaymentMethod(method)}>{paymentLabels[method]}</Button>)}
            </div>
          </fieldset>
          <div className="field mb-4">
            <Label htmlFor="sale-slip-upload">แนบสลิป (ไม่บังคับ)</Label>
            <Input ref={slipInputRef} id="sale-slip-upload" data-testid="input-sale-slip" type="file" accept="image/jpeg,image/png,image/webp" disabled={createSale.isPending || uploadingSlip} onChange={(event) => {
              setSlipFile(event.target.files?.[0] ?? null);
              setSlipPath(null);
              setUploadError("");
            }} />
            <p className="field-hint">ภาพส่วนตัว JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB</p>
            {slipFile && <p className="mt-1 text-xs text-[var(--muted)]" data-testid="text-slip-upload-state">{slipPath ? "อัปโหลดแล้วและพร้อมบันทึก" : `เลือกแล้ว: ${slipFile.name}`}</p>}
            {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
          </div>
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
            <span className="text-sm text-[var(--muted)]">ยอดรวม</span>
            <strong className="font-mono text-xl text-[var(--gold-2)]" data-testid="text-sale-total">{money(total)}</strong>
          </div>
          {formError && <p className="field-error mt-3" role="alert" data-testid="status-sale-error">{formError}</p>}
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={!cart.length || createSale.isPending || uploadingSlip} data-testid="button-submit-product-sale">
            {uploadingSlip ? "กำลังอัปโหลดสลิป..." : createSale.isPending ? "กำลังบันทึก..." : "ยืนยันและบันทึกการขาย"}
          </Button>
          {total > 100_000_000 && <p className="field-error mt-2" role="alert">ยอดรวมต่อบิลต้องไม่เกิน 100,000,000 บาท</p>}
          {createSale.isPending && <p className="mt-2 text-center text-xs text-[var(--muted)]" role="status">กำลังบันทึกอย่างปลอดภัย กรุณารอสักครู่</p>}
        </section>
      </form>

      <section className="panel p-4 sm:p-5" aria-labelledby="staff-sales-history-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="eyebrow">Independent product ledger</p><h3 id="staff-sales-history-title" className="font-display text-lg font-semibold">ประวัติการขายสินค้า</h3></div>
          {sales.data && <p className="text-sm text-[var(--muted)]" data-testid="text-staff-sales-summary">{sales.data.completed_count} สำเร็จ · {sales.data.voided_count} ยกเลิก · {money(sales.data.total_amount_baht)}</p>}
        </div>
        {sales.isLoading ? <LoadingState label="กำลังโหลดประวัติการขาย" compact />
          : sales.isError ? <ErrorState message={errorText(sales.error)} onRetry={() => void sales.refetch()} retrying={sales.isFetching} />
            : !sales.data?.sales.length ? <EmptyState title="ยังไม่มีรายการขายสินค้าสำหรับวันที่เลือก" />
              : <ul className="divide-y divide-[var(--line)] list-none p-0">
                {sales.data.sales.map((sale) => <SaleHistoryRow key={sale.id} sale={sale} canVoid onVoid={() => { setVoidTarget(sale); setVoidReason(""); }} />)}
              </ul>}
      </section>

      <Dialog open={Boolean(voidTarget)} onOpenChange={(open) => { if (!open && !voidSale.isPending) setVoidTarget(null); }}>
        <DialogContent className="dialog panel">
          <DialogHeader>
            <DialogTitle>ยืนยันยกเลิกรายการ</DialogTitle>
            <DialogDescription>รายการจะถูกทำเครื่องหมายยกเลิกและปรับคืนสต็อกตามระบบ กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submitVoid(event)} className="space-y-4">
            <div className="field">
              <Label htmlFor="sale-void-reason">เหตุผลการยกเลิก</Label>
              <Input id="sale-void-reason" value={voidReason} maxLength={200} minLength={3} required data-testid="input-sale-void-reason" onChange={(event) => setVoidReason(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={voidSale.isPending} onClick={() => setVoidTarget(null)}>กลับ</Button>
              <Button type="submit" variant="destructive" disabled={voidReason.trim().length < 3 || voidSale.isPending} data-testid="button-confirm-sale-void">{voidSale.isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OwnerProductSales() {
  const [date, setDate] = useState(bangkokDate);
  const params = useMemo(() => ({ date }), [date]);
  const queryKey = getListOwnerProductSalesQueryKey(params);
  const report = useListOwnerProductSales(params, {
    query: { queryKey, retry: false },
  });

  return <section className="space-y-4" data-testid="owner-product-sales">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">Non-loyalty product ledger</p><h2 className="font-display text-2xl font-semibold">รายงานขายสินค้าทั่วไป</h2><p className="mt-1 text-sm text-[var(--muted)]">ตรวจสอบได้อย่างเดียว · ไม่รวมในบัญชีขายสะสมแต้ม</p></div>
      <div className="field min-w-44">
        <Label htmlFor="owner-product-sales-date">วันที่ (เวลาไทย)</Label>
        <Input id="owner-product-sales-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-owner-product-sales-date" />
      </div>
    </header>
    {report.isLoading ? <LoadingState label="กำลังโหลดรายงานขายสินค้า" />
      : report.isError ? <ErrorState message={errorText(report.error)} onRetry={() => void report.refetch()} retrying={report.isFetching} />
        : !report.data ? <EmptyState title="ไม่มีข้อมูลรายงาน" />
          : <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="สรุปยอดขายสินค้าทั่วไป">
              <div className="panel p-4"><p className="text-xs text-[var(--muted)]">ยอดขายสุทธิ</p><p className="mt-2 font-mono text-xl font-semibold text-[var(--gold-2)]" data-testid="text-owner-product-sales-total">{money(report.data.total_amount_baht)}</p></div>
              <div className="panel p-4"><p className="text-xs text-[var(--muted)]">รายการสำเร็จ</p><p className="mt-2 font-mono text-xl font-semibold" data-testid="text-owner-product-sales-completed">{report.data.completed_count}</p></div>
              <div className="panel col-span-2 p-4 lg:col-span-1"><p className="text-xs text-[var(--muted)]">รายการยกเลิก</p><p className="mt-2 font-mono text-xl font-semibold" data-testid="text-owner-product-sales-voided">{report.data.voided_count}</p></div>
            </div>
            {!report.data.sales.length ? <EmptyState title="ไม่มีรายการขายในวันที่เลือก" />
              : <ul className="panel divide-y divide-[var(--line)] list-none px-4 sm:px-5">
                {report.data.sales.map((sale) => <SaleHistoryRow key={sale.id} sale={sale} canVoid={false} />)}
              </ul>}
          </>}
  </section>;
}

function SaleHistoryRow({ sale, canVoid, onVoid }: { sale: QuickSale; canVoid: boolean; onVoid?: () => void }) {
  const shortage = sale.items.some((item) => item.stock_shortage_quantity > 0);
  return <li className="py-4" data-testid={`row-product-sale-${sale.id}`}>
    <article className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display font-semibold">{saleTime(sale.created_at)} · {money(sale.amount_baht)}</h4>
            <span className={`chip ${sale.status === "voided" ? "chip-pending" : "chip-done"}`} data-testid={`status-product-sale-${sale.id}`}>{sale.status === "voided" ? "ยกเลิก" : "สำเร็จ"}</span>
            <span className="chip">{paymentLabels[sale.payment_method]}</span>
          </div>
          <ul className="mt-2 list-none space-y-1 p-0 text-sm">
            {sale.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-x-3 text-[var(--muted)]">
              <span>{item.name} × {item.quantity}</span><span className="font-mono">{money(item.line_total_baht)}</span>
              {item.stock_shortage_quantity > 0 && <span className="w-full text-xs text-[var(--gold-2)]">ขาดสต็อก {item.stock_shortage_quantity} {item.stock_unit ?? "หน่วย"} · ตัดได้ถึงศูนย์เท่านั้น ต้องตรวจนับใหม่</span>}
            </li>)}
          </ul>
          {sale.status === "voided" && sale.void_reason && <p className="mt-2 text-xs text-[var(--muted)]" data-testid={`text-void-reason-${sale.id}`}>เหตุผลยกเลิก: {sale.void_reason}</p>}
          <p className="mt-2 text-xs text-[var(--muted)]">บันทึกโดย {sale.recorded_by === "owner" ? "เจ้าของร้าน" : "พนักงาน"}{sale.has_slip ? " · มีสลิปแนบ" : ""}</p>
        </div>
        {canVoid && sale.status === "completed" && <Button type="button" variant="outline" size="sm" data-testid={`button-void-sale-${sale.id}`} onClick={onVoid}>ยกเลิกรายการ</Button>}
      </div>
      {sale.has_slip && <details className="rounded-lg border border-[var(--line)] p-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium focus-visible:outline-none">ดูสลิปส่วนตัว</summary>
        <img
          src={canVoid ? getGetStaffProductSaleSlipUrl(encodeURIComponent(sale.id)) : getGetOwnerProductSaleSlipUrl(encodeURIComponent(sale.id))}
          alt={`สลิปส่วนตัวของรายการ ${saleTime(sale.created_at)}`}
          loading="lazy"
          className="mt-2 max-h-96 max-w-full rounded-lg object-contain"
          data-testid={`img-sale-slip-${sale.id}`}
        />
      </details>}
      {shortage && <p role="status" className="rounded-lg border border-[var(--line)] p-3 text-sm text-[var(--gold-2)]" data-testid={`status-stock-shortage-${sale.id}`}>
        การขายสำเร็จแล้ว แต่สต็อกถูกหักได้ถึงศูนย์เท่านั้น ต้องตรวจนับสต็อกอีกครั้ง
      </p>}
    </article>
  </li>;
}
