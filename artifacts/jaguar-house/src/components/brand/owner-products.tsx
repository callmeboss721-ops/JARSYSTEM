"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { OwnerProduct } from "@workspace/api-client-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { Label } from "@workspace/jaguar-spk-design-system/components/ui/label";
import { Textarea } from "@workspace/jaguar-spk-design-system/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/brand/ui";
import { OWNER, api, errorText, isWholeBaht, json } from "@/components/brand/loyalty-api";
import { uploadPrivateImage } from "@/components/brand/private-upload";

export function OwnerProducts() {
  const qc = useQueryClient();
  const products = useQuery<OwnerProduct[]>({
    queryKey: [`${OWNER}/products`],
    queryFn: () => api(`${OWNER}/products`),
  });
  const [editing, setEditing] = useState<OwnerProduct | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageFile(null);
    setRemoveImage(false);
    setFileInputKey((key) => key + 1);
    setMessage("");
  };

  const beginEdit = (product: OwnerProduct) => {
    setEditing(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(String(product.price_baht));
    setImageFile(null);
    setRemoveImage(false);
    setFileInputKey((key) => key + 1);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || Array.from(trimmedName).length > 120) {
      setMessage("กรอกชื่อสินค้า 1–120 ตัวอักษร");
      return;
    }
    if (!isWholeBaht(price) || Number(price) > 100_000_000) {
      setMessage("กรอกราคาเป็นจำนวนเต็มตั้งแต่ 1–100,000,000 บาท");
      return;
    }
    if (Array.from(description.trim()).length > 600) {
      setMessage("รายละเอียดต้องไม่เกิน 600 ตัวอักษร");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      let imagePath: string | null | undefined;
      if (imageFile) imagePath = await uploadPrivateImage(imageFile, "product_image");
      else if (removeImage) imagePath = null;
      const body = {
        name: trimmedName,
        description: description.trim(),
        price_baht: Number(price),
        is_active: editing?.is_active ?? true,
        ...(imagePath === undefined ? {} : { reference_image_path: imagePath }),
      };
      if (editing) {
        await api(`${OWNER}/products/${encodeURIComponent(editing.id)}`, json("PATCH", body));
        setMessage("บันทึกการแก้ไขสินค้าแล้ว");
      } else {
        await api(`${OWNER}/products`, json("POST", body));
        setMessage("เพิ่มสินค้าในแคตตาล็อกแล้ว");
      }
      resetForm();
      setMessage(editing ? "บันทึกการแก้ไขสินค้าแล้ว" : "เพิ่มสินค้าในแคตตาล็อกแล้ว");
      await qc.invalidateQueries({ queryKey: [`${OWNER}/products`] });
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleProduct = async (product: OwnerProduct) => {
    setBusy(true);
    setMessage("");
    try {
      await api(`${OWNER}/products/${encodeURIComponent(product.id)}`, json("PATCH", {
        name: product.name,
        description: product.description,
        price_baht: product.price_baht,
        is_active: !product.is_active,
      }));
      await qc.invalidateQueries({ queryKey: [`${OWNER}/products`] });
      setMessage(product.is_active ? "ปิดสินค้าจากแคตตาล็อกแล้ว" : "เปิดสินค้าในแคตตาล็อกแล้ว");
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">Private catalog</p>
        <h2 className="font-display text-xl font-semibold mt-1">จัดการสินค้า</h2>
        <p className="text-sm text-[var(--muted)] mt-2 mb-5">
          แคตตาล็อกนี้แยกจากหน้าขาย ราคาและรายการที่บันทึกไว้จะไม่เปลี่ยนสูตรคิดยอดหรือแต้ม
        </p>

        <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="catalog-product-name">ชื่อสินค้า</Label>
            <Input id="catalog-product-name" className="mt-2" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="catalog-product-price">ราคาอ้างอิง (บาท)</Label>
            <Input id="catalog-product-price" className="mt-2" type="number" min={1} max={100_000_000} step={1} inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="catalog-product-description">รายละเอียด</Label>
            <Textarea id="catalog-product-description" className="mt-2 min-h-24" maxLength={600} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="catalog-product-image">ภาพอ้างอิงสินค้า (ไม่บังคับ)</Label>
            <Input
              key={fileInputKey}
              id="catalog-product-image"
              className="mt-2"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] ?? null);
                setRemoveImage(false);
              }}
            />
            <p className="text-xs text-[var(--muted)] mt-2">JPG, PNG หรือ WebP · ไม่เกิน 5 MB · ภาพเก็บเป็นไฟล์ส่วนตัวสำหรับเจ้าของร้าน</p>
            {editing?.has_image && !removeImage && !imageFile && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  className="h-20 w-20 rounded-xl border border-[var(--line)] object-cover"
                  src={`${OWNER}/products/${encodeURIComponent(editing.id)}/image`}
                  alt={`ภาพอ้างอิง ${editing.name}`}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setRemoveImage(true)}>นำภาพออก</Button>
              </div>
            )}
            {previewUrl && (
              <img className="mt-3 h-24 w-24 rounded-xl border border-[var(--line)] object-cover" src={previewUrl} alt="ตัวอย่างภาพอ้างอิงสินค้า" />
            )}
            {removeImage && <p role="status" className="text-sm text-[var(--muted)] mt-2">บันทึกแล้วภาพเดิมจะถูกนำออกจากรายการสินค้า</p>}
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "กำลังบันทึก…" : editing ? "บันทึกสินค้า" : "เพิ่มสินค้า"}</Button>
            {editing && <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>ยกเลิก</Button>}
          </div>
          {message && <p role="status" className="md:col-span-2 text-sm text-[var(--gold-2)]">{message}</p>}
        </form>
      </section>

      <section className="panel p-5 sm:p-6" aria-labelledby="catalog-list-title">
        <h2 id="catalog-list-title" className="font-display text-xl font-semibold mb-4">รายการสินค้า</h2>
        {products.isLoading ? <LoadingState label="กำลังโหลดสินค้า" compact /> :
          products.isError ? <ErrorState message={errorText(products.error)} onRetry={() => void products.refetch()} retrying={products.isFetching} /> :
            !products.data?.length ? <EmptyState title="ยังไม่มีสินค้าในแคตตาล็อก" /> :
              <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {products.data.map((product) => (
                  <li key={product.id} className="rounded-xl border border-[var(--line)] p-4">
                    {product.has_image && (
                      <img
                        className="mb-3 h-40 w-full rounded-lg border border-[var(--line)] object-cover"
                        src={`${OWNER}/products/${encodeURIComponent(product.id)}/image`}
                        alt={`ภาพอ้างอิง ${product.name}`}
                        loading="lazy"
                      />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold break-words">{product.name}</h3>
                        <p className="mt-1 text-sm text-[var(--gold-2)]">฿{product.price_baht.toLocaleString("th-TH")}</p>
                      </div>
                      <span className={`chip ${product.is_active ? "chip-done" : "chip-pending"} shrink-0`}>
                        {product.is_active ? "เปิดใช้" : "ปิด"}
                      </span>
                    </div>
                    {product.description && <p className="mt-2 text-sm text-[var(--muted)] whitespace-pre-wrap break-words">{product.description}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => beginEdit(product)}>แก้ไข</Button>
                      <Button type="button" variant={product.is_active ? "ghost" : "secondary"} size="sm" disabled={busy} onClick={() => void toggleProduct(product)}>
                        {product.is_active ? "ปิดสินค้า" : "เปิดสินค้า"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>}
      </section>
    </div>
  );
}
