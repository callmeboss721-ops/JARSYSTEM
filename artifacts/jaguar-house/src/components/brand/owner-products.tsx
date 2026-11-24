"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ImportOwnerProductRow,
  OwnerProduct,
  OwnerProductStockEvent,
} from "@workspace/api-client-react";
import {
  getListOwnerProductStockHistoryQueryKey,
  getListOwnerProductsQueryKey,
  useCreateOwnerProduct,
  useImportOwnerProducts,
  useListOwnerProductStockHistory,
  useListOwnerProducts,
  useUpdateOwnerProduct,
  useUpdateOwnerProductStock,
} from "@workspace/api-client-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { Label } from "@workspace/jaguar-spk-design-system/components/ui/label";
import { Textarea } from "@workspace/jaguar-spk-design-system/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/brand/ui";
import { OWNER, errorText, isWholeBaht } from "@/components/brand/loyalty-api";
import { uploadPrivateImage } from "@/components/brand/private-upload";

const CSV_HEADERS = ["category", "name", "description", "price_baht", "stock_quantity", "stock_unit"] as const;
const CSV_MAX_BYTES = 1024 * 1024;
const CSV_MAX_ROWS = 200;

type CsvPreviewRow = {
  rowNumber: number;
  row: ImportOwnerProductRow;
  duplicate: boolean;
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let afterQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
      afterQuote = false;
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      afterQuote = false;
    } else {
      if (afterQuote && !/\s/.test(character)) throw new Error("พบข้อความต่อท้ายช่องที่ปิดเครื่องหมายอัญประกาศ");
      cell += character;
    }
  }
  if (quoted) throw new Error("พบเครื่องหมายอัญประกาศที่ไม่ปิดในไฟล์ CSV");
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function validateCsv(text: string, existingProducts: OwnerProduct[]): { rows: CsvPreviewRow[]; errors: string[] } {
  const parsed = parseCsvText(text);
  if (parsed.length < 2) throw new Error("ไฟล์ต้องมีหัวตารางและข้อมูลสินค้าอย่างน้อย 1 แถว");
  const headers = parsed[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  if (headers.length !== CSV_HEADERS.length || headers.some((header, index) => header !== CSV_HEADERS[index])) {
    throw new Error(`หัวตารางต้องเรียงตามนี้: ${CSV_HEADERS.join(", ")}`);
  }
  const dataRows = parsed.slice(1);
  if (dataRows.length > CSV_MAX_ROWS) throw new Error(`ไฟล์มีได้ไม่เกิน ${CSV_MAX_ROWS} แถว`);
  const productKey = (productCategory: string, productName: string) =>
    `${productCategory.trim().toLocaleLowerCase("th-TH")}\u0000${productName.trim().toLocaleLowerCase("th-TH")}`;
  const knownNames = new Set(existingProducts.map((product) => productKey(product.category, product.name)));
  const seenNames = new Set<string>();
  const errors: string[] = [];
  const rows = dataRows.map((cells, index): CsvPreviewRow | null => {
    const rowNumber = index + 2;
    if (cells.length !== CSV_HEADERS.length) {
      errors.push(`แถว ${rowNumber}: จำนวนช่องไม่ตรงกับหัวตาราง`);
      return null;
    }
    const [categoryRaw, nameRaw, descriptionRaw, priceRaw, quantityRaw, unitRaw] = cells.map((cell) => cell.trim());
    const category = categoryRaw;
    const name = nameRaw;
    const description = descriptionRaw;
    const price = Number(priceRaw);
    const quantity = Number(quantityRaw);
    const stockUnit = unitRaw;
    const rowErrors: string[] = [];
    if (!category || category.length > 80) rowErrors.push("หมวดหมู่ต้องมี 1–80 ตัวอักษร");
    if (!name || Array.from(name).length > 120) rowErrors.push("ชื่อต้องมี 1–120 ตัวอักษร");
    if (Array.from(description).length > 600) rowErrors.push("รายละเอียดต้องไม่เกิน 600 ตัวอักษร");
    if (!/^\d+$/.test(priceRaw) || !Number.isInteger(price) || price < 1 || price > 100_000_000) rowErrors.push("ราคาต้องเป็นจำนวนเต็ม 1–100,000,000 บาท");
    if (!/^\d+$/.test(quantityRaw) || !Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000) rowErrors.push("สต็อกต้องเป็นจำนวนเต็ม 0–1,000,000");
    if (!stockUnit || Array.from(stockUnit).length > 24) rowErrors.push("หน่วยสต็อกต้องมี 1–24 ตัวอักษร");
    if (rowErrors.length) {
      errors.push(`แถว ${rowNumber}: ${rowErrors.join(" · ")}`);
      return null;
    }
    const key = productKey(category, name);
    const duplicate = knownNames.has(key) || seenNames.has(key);
    seenNames.add(key);
    return {
      rowNumber,
      duplicate,
      row: { category, name, description, price_baht: price, stock_quantity: quantity, stock_unit: stockUnit },
    };
  }).filter((row): row is CsvPreviewRow => row !== null);
  return { rows, errors };
}

export function OwnerProducts() {
  const queryClient = useQueryClient();
  const listKey = getListOwnerProductsQueryKey();
  const products = useListOwnerProducts({ query: { queryKey: listKey, enabled: true } });
  const createProduct = useCreateOwnerProduct();
  const updateProduct = useUpdateOwnerProduct();
  const updateStock = useUpdateOwnerProductStock();
  const importProducts = useImportOwnerProducts();
  const [editing, setEditing] = useState<OwnerProduct | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnit, setStockUnit] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvReading, setCsvReading] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState<CsvPreviewRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvMessage, setCsvMessage] = useState("");
  const [csvMessageIsError, setCsvMessageIsError] = useState(false);

  const busy = saving || createProduct.isPending || updateProduct.isPending;
  const existingProducts = products.data ?? [];
  const csvImportRows = useMemo(() => csvRows.filter((item) => !item.duplicate).map((item) => item.row), [csvRows]);

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
    setCategory("");
    setDescription("");
    setPrice("");
    setStockQuantity("");
    setStockUnit("");
    setImageFile(null);
    setRemoveImage(false);
    setFileInputKey((key) => key + 1);
  };

  const beginEdit = (product: OwnerProduct) => {
    setEditing(product);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description);
    setPrice(String(product.price_baht));
    setStockQuantity(product.stock_quantity === null ? "" : String(product.stock_quantity));
    setStockUnit(product.stock_unit ?? "");
    setImageFile(null);
    setRemoveImage(false);
    setFileInputKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedUnit = stockUnit.trim();
    if (!trimmedName || Array.from(trimmedName).length > 120) {
      setMessage("กรอกชื่อสินค้า 1–120 ตัวอักษร");
      setMessageIsError(true);
      return;
    }
    if (!trimmedCategory || Array.from(trimmedCategory).length > 80) {
      setMessage("กรอกหมวดหมู่สินค้า 1–80 ตัวอักษร");
      setMessageIsError(true);
      return;
    }
    if (!isWholeBaht(price) || Number(price) > 100_000_000) {
      setMessage("กรอกราคาเป็นจำนวนเต็มตั้งแต่ 1–100,000,000 บาท");
      setMessageIsError(true);
      return;
    }
    if (Array.from(description.trim()).length > 600) {
      setMessage("รายละเอียดต้องไม่เกิน 600 ตัวอักษร");
      setMessageIsError(true);
      return;
    }
    const hasQuantity = stockQuantity.trim() !== "";
    if (hasQuantity && (!/^\d+$/.test(stockQuantity) || Number(stockQuantity) > 1_000_000)) {
      setMessage("สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0–1,000,000");
      setMessageIsError(true);
      return;
    }
    if (hasQuantity !== Boolean(trimmedUnit) || trimmedUnit.length > 24) {
      setMessage("กรอกจำนวนสต็อกและหน่วยให้ครบทั้งสองช่อง หรือเว้นว่างทั้งคู่");
      setMessageIsError(true);
      return;
    }
    setMessage("");
    setMessageIsError(false);
    setSaving(true);
    try {
      let imagePath: string | null | undefined;
      if (imageFile) imagePath = await uploadPrivateImage(imageFile, "product_image");
      else if (removeImage) imagePath = null;
      const productData = {
        name: trimmedName,
        category: trimmedCategory,
        description: description.trim(),
        price_baht: Number(price),
        ...(imagePath === undefined ? {} : { reference_image_path: imagePath }),
      };
      if (editing) {
        await updateProduct.mutateAsync({
          id: editing.id,
          data: { ...productData, is_active: editing.is_active },
        });
        await queryClient.invalidateQueries({ queryKey: getListOwnerProductStockHistoryQueryKey(editing.id) });
        setMessage("บันทึกการแก้ไขสินค้าแล้ว");
      } else {
        const created = await createProduct.mutateAsync({
          data: {
            ...productData,
            stock_quantity: hasQuantity ? Number(stockQuantity) : null,
            stock_unit: hasQuantity ? trimmedUnit : null,
            is_active: true,
          },
        });
        await queryClient.invalidateQueries({ queryKey: getListOwnerProductStockHistoryQueryKey(created.id) });
        setMessage("เพิ่มสินค้าในแคตตาล็อกแล้ว");
      }
      setMessageIsError(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: listKey });
    } catch (error) {
      setMessage(errorText(error));
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (product: OwnerProduct) => {
    setMessage("");
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          name: product.name,
          category: product.category,
          description: product.description,
          price_baht: product.price_baht,
          is_active: !product.is_active,
        },
      });
      await queryClient.invalidateQueries({ queryKey: listKey });
      setMessage(product.is_active ? "ปิดสินค้าจากแคตตาล็อกแล้ว" : "เปิดสินค้าในแคตตาล็อกแล้ว");
      setMessageIsError(false);
    } catch (error) {
      setMessage(errorText(error));
      setMessageIsError(true);
    }
  };

  const previewCsv = async (file: File | undefined) => {
    setCsvFileName(file?.name ?? "");
    setCsvRows([]);
    setCsvErrors([]);
    setCsvMessage("");
    setCsvMessageIsError(false);
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) {
      setCsvErrors(["ไฟล์ CSV ต้องมีขนาดไม่เกิน 1 MB"]);
      return;
    }
    if (!file.name.toLocaleLowerCase("en-US").endsWith(".csv")) {
      setCsvErrors(["เลือกไฟล์นามสกุล .csv เท่านั้น"]);
      return;
    }
    try {
      setCsvReading(true);
      const parsed = validateCsv(await file.text(), existingProducts);
      setCsvRows(parsed.rows);
      setCsvErrors(parsed.errors);
      if (!parsed.rows.length && parsed.errors.length === 0) setCsvErrors(["ไม่พบแถวสินค้าที่นำเข้าได้"]);
    } catch (error) {
      setCsvErrors([error instanceof Error ? error.message : "อ่านไฟล์ CSV ไม่สำเร็จ"]);
    } finally {
      setCsvReading(false);
    }
  };

  const confirmImport = async () => {
    if (!csvImportRows.length || csvErrors.length) return;
    setCsvMessage("");
    setCsvMessageIsError(false);
    try {
      const result = await importProducts.mutateAsync({ data: { rows: csvImportRows } });
      await queryClient.invalidateQueries({ queryKey: listKey });
      setCsvMessage(`นำเข้า ${result.created_count} รายการแล้ว · ข้าม ${result.skipped_count + (csvRows.length - csvImportRows.length)} รายการซ้ำ`);
      setCsvMessageIsError(false);
      setCsvRows([]);
      setCsvErrors([]);
      setCsvFileName("");
    } catch (error) {
      setCsvMessage(errorText(error));
      setCsvMessageIsError(true);
    }
  };

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">Private catalog</p>
        <h2 className="font-display text-xl font-semibold mt-1">จัดการสินค้า</h2>
        <p className="text-sm text-[var(--muted)] mt-2 mb-5">
          แคตตาล็อกส่วนตัวแยกจากการขายและแต้ม การปรับสต็อกจะไม่ตัดยอดขายหรือเปลี่ยนคะแนนสมาชิก
        </p>

        <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="catalog-product-name">ชื่อสินค้า</Label>
            <Input id="catalog-product-name" className="mt-2" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="catalog-product-category">หมวดหมู่</Label>
            <Input id="catalog-product-category" className="mt-2" maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} required placeholder="เช่น เครื่องดื่ม" />
          </div>
          <div>
            <Label htmlFor="catalog-product-price">ราคาอ้างอิง (บาท)</Label>
            <Input id="catalog-product-price" className="mt-2" type="number" min={1} max={100_000_000} step={1} inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </div>
          {!editing && (
            <>
              <div>
                <Label htmlFor="catalog-product-stock">จำนวนสต็อกเริ่มต้น (ไม่บังคับ)</Label>
                <Input id="catalog-product-stock" className="mt-2" type="number" min={0} max={1_000_000} step={1} inputMode="numeric" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="catalog-product-unit">หน่วยสต็อก</Label>
                <Input id="catalog-product-unit" className="mt-2" maxLength={24} value={stockUnit} onChange={(event) => setStockUnit(event.target.value)} placeholder="เช่น ขวด, ชิ้น" />
              </div>
            </>
          )}
          {editing && (
            <div className="md:col-span-2 rounded-xl border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
              สต็อกปัจจุบัน {editing.stock_quantity === null ? "ยังไม่ระบุ" : `${editing.stock_quantity.toLocaleString("th-TH")} ${editing.stock_unit ?? ""}`} · ใช้ส่วนปรับสต็อกในรายการสินค้าเพื่อบันทึกประวัติ
            </div>
          )}
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
                <img className="h-20 w-20 rounded-xl border border-[var(--line)] object-cover" src={`${OWNER}/products/${encodeURIComponent(editing.id)}/image`} alt={`ภาพอ้างอิง ${editing.name}`} />
                <Button type="button" variant="outline" size="sm" onClick={() => setRemoveImage(true)}>นำภาพออก</Button>
              </div>
            )}
            {previewUrl && <img className="mt-3 h-24 w-24 rounded-xl border border-[var(--line)] object-cover" src={previewUrl} alt="ตัวอย่างภาพอ้างอิงสินค้า" />}
            {removeImage && <p role="status" className="text-sm text-[var(--muted)] mt-2">บันทึกแล้วภาพเดิมจะถูกนำออกจากรายการสินค้า</p>}
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || createProduct.isPending || updateProduct.isPending}>
              {busy ? "กำลังบันทึก…" : editing ? "บันทึกสินค้า" : "เพิ่มสินค้า"}
            </Button>
            {editing && <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>ยกเลิก</Button>}
          </div>
          {message && <p role={messageIsError ? "alert" : "status"} className={`md:col-span-2 text-sm ${messageIsError ? "field-error" : "text-[var(--emerald-2)]"}`}>{message}</p>}
        </form>
      </section>

      <section className="panel p-5 sm:p-6" aria-labelledby="catalog-import-title">
        <p className="eyebrow">One-time CSV import</p>
        <h2 id="catalog-import-title" className="font-display text-xl font-semibold mt-1">นำเข้าสินค้าจาก CSV</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          เลือกไฟล์เพื่อดูตัวอย่างและตรวจสอบก่อนยืนยัน ไฟล์อยู่ในหน่วยความจำเบราว์เซอร์เท่านั้น · สูงสุด 1 MB และ 200 แถว
        </p>
        <p className="mt-2 break-all text-xs text-[var(--muted)]">หัวตาราง: {CSV_HEADERS.join(", ")}</p>
        <div className="mt-4">
          <Label htmlFor="catalog-csv-file">ไฟล์ CSV</Label>
          <Input id="catalog-csv-file" className="mt-2" type="file" accept=".csv,text/csv" onChange={(event) => void previewCsv(event.target.files?.[0])} />
        </div>
        {csvReading && <LoadingState label="กำลังตรวจสอบไฟล์ CSV" compact />}
        {csvFileName && <p className="mt-3 text-sm" role="status">ไฟล์ที่เลือก: {csvFileName}</p>}
        {!!csvErrors.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--danger)]" role="alert">{csvErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
        {!!csvRows.length && (
          <>
            <div className="mt-4 space-y-2 sm:hidden">
              {csvRows.map(({ row, duplicate, rowNumber }) => (
                <article key={rowNumber} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="flex items-start justify-between gap-3"><strong className="break-words">{row.name}</strong><span className="chip">{duplicate ? "ข้ามรายการซ้ำ" : "พร้อมนำเข้า"}</span></div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{row.category} · ฿{row.price_baht.toLocaleString("th-TH")}</p>
                  <p className="text-xs text-[var(--muted)]">สต็อก {row.stock_quantity.toLocaleString("th-TH")} {row.stock_unit}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr className="border-b border-[var(--line)] text-xs text-[var(--muted)]"><th className="py-2 pr-3">สถานะ</th><th className="py-2 pr-3">หมวดหมู่</th><th className="py-2 pr-3">ชื่อสินค้า</th><th className="py-2 pr-3">ราคา</th><th className="py-2">สต็อก</th></tr></thead>
                <tbody>{csvRows.map(({ row, duplicate, rowNumber }) => <tr key={rowNumber} className="border-b border-[var(--line)]"><td className="py-2 pr-3">{duplicate ? "ข้ามรายการซ้ำ" : "พร้อมนำเข้า"}</td><td className="py-2 pr-3">{row.category}</td><td className="py-2 pr-3">{row.name}</td><td className="py-2 pr-3">฿{row.price_baht.toLocaleString("th-TH")}</td><td className="py-2">{row.stock_quantity.toLocaleString("th-TH")} {row.stock_unit}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">ตรวจพบ {csvRows.length} แถว · นำเข้าได้ {csvImportRows.length} · ข้ามรายการซ้ำ {csvRows.length - csvImportRows.length}</p>
            <Button type="button" className="mt-4" disabled={!csvImportRows.length || !!csvErrors.length || importProducts.isPending} onClick={() => void confirmImport()}>
              {importProducts.isPending ? "กำลังนำเข้า…" : `ยืนยันนำเข้า ${csvImportRows.length} รายการ`}
            </Button>
          </>
        )}
        {csvMessage && <p role={csvMessageIsError ? "alert" : "status"} className="mt-3 text-sm">{csvMessage}</p>}
      </section>

      <section className="panel p-5 sm:p-6" aria-labelledby="catalog-list-title">
        <h2 id="catalog-list-title" className="font-display text-xl font-semibold mb-4">รายการสินค้า</h2>
        {products.isLoading ? <LoadingState label="กำลังโหลดสินค้า" compact /> :
          products.isError ? <ErrorState message={errorText(products.error)} onRetry={() => void products.refetch()} retrying={products.isFetching} /> :
            !products.data?.length ? <EmptyState title="ยังไม่มีสินค้าในแคตตาล็อก" body="เพิ่มรายการด้วยฟอร์มด้านบน หรือเลือกไฟล์ CSV เพื่อตรวจสอบและนำเข้า" /> :
              <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {products.data.map((product) => (
                  <li key={product.id} className="min-w-0 rounded-xl border border-[var(--line)] p-4">
                    {product.has_image && <img className="mb-3 h-40 w-full rounded-lg border border-[var(--line)] object-cover" src={`${OWNER}/products/${encodeURIComponent(product.id)}/image`} alt={`ภาพอ้างอิง ${product.name}`} loading="lazy" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[var(--muted)]">{product.category}</p>
                        <h3 className="font-semibold break-words">{product.name}</h3>
                        <p className="mt-1 text-sm text-[var(--gold-2)]">฿{product.price_baht.toLocaleString("th-TH")}</p>
                      </div>
                      <span className={`chip ${product.is_active ? "chip-done" : "chip-pending"} shrink-0`}>{product.is_active ? "เปิดใช้" : "ปิด"}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {product.stock_quantity === null
                        ? "สต็อกยังไม่ระบุ"
                        : `สต็อก ${product.stock_quantity.toLocaleString("th-TH")} ${product.stock_unit ?? ""}`}
                    </p>
                    {product.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--muted)]">{product.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => beginEdit(product)}>แก้ไข</Button>
                      <Button type="button" variant={product.is_active ? "ghost" : "secondary"} size="sm" disabled={busy} onClick={() => void toggleProduct(product)}>{product.is_active ? "ปิดสินค้า" : "เปิดสินค้า"}</Button>
                    </div>
                    <ProductStockPanel product={product} />
                  </li>
                ))}
              </ul>}
      </section>
    </div>
  );
}

function ProductStockPanel({ product }: { product: OwnerProduct }) {
  const queryClient = useQueryClient();
  const historyKey = getListOwnerProductStockHistoryQueryKey(product.id);
  const updateStock = useUpdateOwnerProductStock();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.stock_quantity === null ? "" : String(product.stock_quantity));
  const [unit, setUnit] = useState(product.stock_unit ?? "");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);

  const submitStock = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d+$/.test(quantity) || Number(quantity) > 1_000_000 || !unit.trim() || unit.trim().length > 24 || !reason.trim() || reason.trim().length > 160) {
      setFeedback("กรอกจำนวน 0–1,000,000 หน่วย และเหตุผล 1–160 ตัวอักษร");
      setFailed(true);
      return;
    }
    setFeedback("");
    try {
      await updateStock.mutateAsync({
        id: product.id,
        data: { quantity: Number(quantity), stock_unit: unit.trim(), reason: reason.trim() },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListOwnerProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: historyKey }),
      ]);
      setReason("");
      setFeedback("บันทึกสต็อกและประวัติการปรับแล้ว");
      setFailed(false);
    } catch (error) {
      setFeedback(errorText(error));
      setFailed(true);
    }
  };

  const toggleHistory = async () => {
    setOpen((value) => !value);
  };

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-3">
      <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => void toggleHistory()}>
        {open ? "ซ่อนสต็อกและประวัติ" : "ปรับสต็อก / ดูประวัติ"}
      </Button>
      {open && (
        <div className="mt-3 space-y-4">
          <form className="space-y-3" onSubmit={submitStock}>
            <div>
              <Label htmlFor={`stock-quantity-${product.id}`}>จำนวนคงเหลือ</Label>
              <Input id={`stock-quantity-${product.id}`} className="mt-1" type="number" min={0} max={1_000_000} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor={`stock-unit-${product.id}`}>หน่วย</Label>
              <Input id={`stock-unit-${product.id}`} className="mt-1" maxLength={24} value={unit} onChange={(event) => setUnit(event.target.value)} required />
            </div>
            <div>
              <Label htmlFor={`stock-reason-${product.id}`}>เหตุผลการปรับ (จำเป็น)</Label>
              <Textarea id={`stock-reason-${product.id}`} className="mt-1 min-h-20" maxLength={160} value={reason} onChange={(event) => setReason(event.target.value)} required />
            </div>
            <Button type="submit" size="sm" disabled={updateStock.isPending}>{updateStock.isPending ? "กำลังบันทึก…" : "บันทึกสต็อก"}</Button>
            {feedback && <p role={failed ? "alert" : "status"} className="text-xs">{feedback}</p>}
          </form>
          <StockHistoryPanel product={product} />
        </div>
      )}
    </div>
  );
}

function StockHistoryPanel({ product }: { product: OwnerProduct }) {
  const historyKey = getListOwnerProductStockHistoryQueryKey(product.id);
  const history = useListOwnerProductStockHistory(product.id, {
    query: { enabled: !!product.id, queryKey: historyKey },
  });
  return (
    <section aria-label={`ประวัติสต็อก ${product.name}`}>
      <h4 className="text-sm font-semibold">ประวัติการปรับสต็อก</h4>
      {history.isLoading && <LoadingState label="กำลังโหลดประวัติสต็อก" compact />}
      {history.isError && <ErrorState message={errorText(history.error)} onRetry={() => void history.refetch()} retrying={history.isFetching} />}
      {history.isSuccess && !history.data?.length && <EmptyState title="ยังไม่มีประวัติการปรับสต็อก" />}
      {history.data?.length ? <StockHistory events={history.data} /> : null}
    </section>
  );
}

function StockHistory({ events }: { events: OwnerProductStockEvent[] }) {
  return (
    <ol className="mt-2 list-none space-y-2 p-0">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border border-[var(--line)] p-3 text-xs">
          <p className="font-medium">{event.previous_quantity === null ? "ไม่ระบุ" : event.previous_quantity.toLocaleString("th-TH")} → {event.new_quantity.toLocaleString("th-TH")} {event.stock_unit}</p>
          <p className="mt-1 break-words text-[var(--muted)]">{event.reason}</p>
          <p className="mt-1 text-[var(--muted)]">{event.source === "manual" ? "ปรับด้วยตนเอง" : "นำเข้าจาก CSV"} · {new Date(event.created_at).toLocaleString("th-TH")}</p>
        </li>
      ))}
    </ol>
  );
}
