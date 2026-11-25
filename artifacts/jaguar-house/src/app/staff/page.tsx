"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JaguarMark } from "@/components/brand/jaguar-mark";
import { BrandArtworkButton } from "@/components/brand/brand-button";
import { BrandIcon, type BrandIconName } from "@/components/brand/brand-icon";
import { EmptyState, ErrorState, LoadingSpinner, LoadingState } from "@/components/brand/ui";
import { Skeleton } from "@workspace/jaguar-spk-design-system/components/ui/skeleton";
import { PinPad } from "@/components/brand/pin-pad";
import { StaffBanking } from "@/components/brand/banking";
import { StaffProductSales } from "@/components/brand/product-sales";
import { playStaffSuccessSound, primeStaffSuccessSound, readStaffSoundPreference, saveStaffSoundPreference } from "@/components/brand/staff-feedback";
import { STAMPS } from "@/components/brand/loyalty-card";
import { STAFF, api, bundlePrice, cleanCode, clearScope, codePattern, errorText, formulaLabels, isBottleCount, json, statusOf, type Formula, type MemberCardData, type RedemptionData } from "@/components/brand/loyalty-api";
import { getGetCannabisMemberCardQueryKey, getGetStaffCannabisCardQueryKey, getGetStaffSecurityQueryKey, useGetStaffSecurity, useGetStaffCannabisCard, useAddCannabisStamps, useRedeemCannabisAtCounter, useCreditStaffPoints } from "@workspace/api-client-react";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { Label } from "@workspace/jaguar-spk-design-system/components/ui/label";
import { uploadPrivateImage } from "@/components/brand/private-upload";
import {
  getListRecentStaffRedemptionsQueryKey,
  getListStaffRewardsQueryKey,
  getListStaffSalesQueryKey,
  useCorrectStaffCannabisTransaction,
  useCorrectStaffRedemption,
  useCorrectStaffSale,
  useListRecentStaffRedemptions,
  useListStaffRewards,
  useListStaffSales,
} from "@workspace/api-client-react";

type Tab = "counter" | "product-sales" | "members" | "open" | "banking" | "settings";
const TABS: [Tab, string, BrandIconName][] = [["counter", "ขาย / แลก", "lightning"], ["members", "สมาชิก", "members"], ["open", "เปิดบัญชี", "add"], ["banking", "บัญชี / โอน", "banking"], ["settings", "ตั้งค่า PIN", "security"]];
const formulaShort: Record<Formula, string> = { red: "แดง · Original", silver: "ฟ้า · Refresh", gold: "ทอง · Premium" };

export default function StaffPage() {
  const qc = useQueryClient();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tab, setTab] = useState<Tab>("counter");
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [counterActionComplete, setCounterActionComplete] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [lookup, setLookup] = useState("");
  const [member, setMember] = useState<MemberCardData | null>(null);
  const [bottleCount, setBottleCount] = useState("");
  const [bottleCountErr, setBottleCountErr] = useState("");
  const [formula, setFormula] = useState<Formula>("red");
  const [redeemId, setRedeemId] = useState<string | null>(null);
  const [name, setName] = useState(""), [code, setCode] = useState(""), [phone, setPhone] = useState(""), [nickname, setNickname] = useState("");
  const [oldPin, setOldPin] = useState(""), [newPin, setNewPin] = useState("");
  const [search, setSearch] = useState(""), [query, setQuery] = useState("");
  const [scanError, setScanError] = useState(""), [scanning, setScanning] = useState(false);
  const [counterMode, setCounterMode] = useState<"kratom" | "cannabis">("kratom");
  const [quickLookup, setQuickLookup] = useState("");
  const [quickMatches, setQuickMatches] = useState<MemberCardData[]>([]);
  const [quickSearchBusy, setQuickSearchBusy] = useState(false);
  const [quickPoints, setQuickPoints] = useState("");
  const [quickPointsError, setQuickPointsError] = useState("");
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [cannabisSearch, setCannabisSearch] = useState("");
  const [cannabisLookup, setCannabisLookup] = useState("");
  const [grams, setGrams] = useState("");
  const [gramsError, setGramsError] = useState("");
  const [cannabisRedeemId, setCannabisRedeemId] = useState<string | null>(null);
  const [saleSlipFile, setSaleSlipFile] = useState<File | null>(null);
  const [saleSlipPath, setSaleSlipPath] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<{
    id: string; bottle_count: string; formula: Formula; reason: string;
    slipFile: File | null; removeSlip: boolean;
  } | null>(null);
  const [editingCannabis, setEditingCannabis] = useState<{ id: string; grams: string; reason: string } | null>(null);
  const [editingRedemption, setEditingRedemption] = useState<{ id: string; reward_id: string; reason: string } | null>(null);
  const [shiftTotals, setShiftTotals] = useState({ bills: 0, bottles: 0, baht: 0 });
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const cannabisStampRequest = useRef<{ signature: string; id: string } | null>(null);
  const pointsRequest = useRef<{ signature: string; id: string } | null>(null);
  const scanResult = useRef<(text: string) => void>(() => undefined);
  const soundEnabledRef = useRef(false);

  const announceSuccess = (message: string) => {
    setMsg(message);
    if (soundEnabledRef.current) playStaffSuccessSound();
  };
  const toggleStaffSound = () => {
    const enabled = !soundEnabledRef.current;
    soundEnabledRef.current = enabled;
    setSoundEnabled(enabled);
    saveStaffSoundPreference(enabled);
  };
  const addRecentActivity = (entry: string) => setRecentActivity((items) => [entry, ...items].slice(0, 5));

  const staffSecurityKey = getGetStaffSecurityQueryKey();
  const security = useGetStaffSecurity({ query: { queryKey: staffSecurityKey, enabled: auth === true, retry: false } });
  const queue = useQuery<RedemptionData[]>({ queryKey: [`${STAFF}/redemptions`], queryFn: () => api(`${STAFF}/redemptions`), enabled: auth === true, refetchInterval: 12000 });
  const recentRedemptions = useListRecentStaffRedemptions({
    query: { queryKey: getListRecentStaffRedemptionsQueryKey(), enabled: auth === true && tab === "counter", retry: false, refetchInterval: 15000 },
  });
  const staffRewards = useListStaffRewards({
    query: { queryKey: getListStaffRewardsQueryKey(), enabled: auth === true && tab === "counter", retry: false },
  });
  const members = useQuery<MemberCardData[]>({ queryKey: [`${STAFF}/members`, query], queryFn: () => api(`${STAFF}/members?q=${encodeURIComponent(query)}`), enabled: auth === true && tab === "members" });
  const salesParams = { code: member?.member_code ?? "" };
  const sales = useListStaffSales(salesParams, {
    query: {
      queryKey: getListStaffSalesQueryKey(salesParams),
      enabled: auth === true && tab === "counter" && counterMode === "kratom" && Boolean(member),
      retry: false,
      refetchInterval: 15000,
    },
  });
  const visibleMembers = (members.data ?? []).filter((m) => !m.is_demo);
  const cannabisParams = cannabisLookup.startsWith("JAGUAR1:")
    ? { qr_token: cannabisLookup }
    : cannabisLookup ? { code: cleanCode(cannabisLookup) } : undefined;
  const cannabisCardQueryKey = getGetStaffCannabisCardQueryKey(cannabisParams);
  const cannabisCardQuery = useGetStaffCannabisCard(cannabisParams, {
    query: { enabled: auth === true && tab === "counter" && counterMode === "cannabis" && !!cannabisLookup, queryKey: cannabisCardQueryKey, retry: false },
  });
  const cannabisCard = cannabisCardQuery.data;
  const addCannabisStamps = useAddCannabisStamps();
  const redeemCannabis = useRedeemCannabisAtCounter();
  const correctSale = useCorrectStaffSale();
  const correctCannabis = useCorrectStaffCannabisTransaction();
  const correctRedemption = useCorrectStaffRedemption();
  const creditStaffPoints = useCreditStaffPoints();
  const hasCounterMember = counterMode === "kratom" ? Boolean(member) : Boolean(cannabisCard);
  const confirmingRedemption = Boolean(redeemId || cannabisRedeemId);
  const workflowStep = !hasCounterMember ? 0 : counterActionComplete ? 3 : confirmingRedemption ? 2 : 1;

  useEffect(() => {
    const enabled = readStaffSoundPreference();
    soundEnabledRef.current = enabled;
    setSoundEnabled(enabled);
    if (enabled) primeStaffSuccessSound();
  }, []);

  useEffect(() => {
    void api(`${STAFF}/security`).then(() => setAuth(true)).catch((e) => {
      const s = statusOf(e);
      if (s !== 401 && s !== 403) setErr(errorText(e));
      setAuth(false);
    });
    const scan = new URLSearchParams(location.search).get("scan");
    if (scan) { setLookup(scan); history.replaceState(null, "", "/staff"); }
    return () => controls.current?.stop();
  }, []);

  const signOutLocal = () => { setAuth(false); setMember(null); setScanning(false); setRecentActivity([]); clearScope(qc, "staff"); };
  const login = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,12}$/.test(pin)) { setErr("PIN พนักงานเป็นตัวเลข 4–12 หลัก"); return; }
    if (soundEnabledRef.current) primeStaffSuccessSound();
    setBusy(true); setErr("");
    try { await api(`${STAFF}/login`, json("POST", { pin })); setPin(""); setAuth(true); }
    catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const saleRequest = useRef<{ signature: string; id: string } | null>(null);
  const logout = async () => {
    try {
      await api(`${STAFF}/logout`, json("POST"));
      saleRequest.current = null;
      signOutLocal(); setMsg("");
    } catch (e) { setErr(errorText(e)); }
  };
  const find = async (value = lookup) => {
    setCounterActionComplete(false);
    setErr(""); setMsg(""); setMember(null); setRedeemId(null);
    setSaleSlipFile(null); setSaleSlipPath(null); setEditingSale(null); saleRequest.current = null;
    try {
      const endpoint = value.startsWith("JAGUAR1:") ? `${STAFF}/member?qr_token=${encodeURIComponent(value)}` : `${STAFF}/member?code=${encodeURIComponent(cleanCode(value))}`;
      const result = await api<MemberCardData>(endpoint);
      if (result.is_demo) { setErr("ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง"); return; }
      setMember(result);
    } catch (e) { setErr(errorText(e)); }
  };
  const quickFind = async (event: FormEvent) => {
    event.preventDefault();
    const value = quickLookup.trim();
    if (!value) return;
    setErr(""); setMsg(""); setQuickMatches([]);
    if (value.startsWith("JAGUAR1:")) {
      if (counterMode === "cannabis") {
        setCannabisSearch(value); setCannabisLookup(value); setMember(null);
      } else {
        setLookup(value); await find(value);
      }
      return;
    }
    setQuickSearchBusy(true);
    try {
      const results = await api<MemberCardData[]>(`${STAFF}/members?q=${encodeURIComponent(value)}`);
      const matches = results.filter((result) => !result.is_demo);
      if (!matches.length) { setErr("ไม่พบสมาชิกจากรหัส เบอร์โทร หรือเลขท้าย 4 หลัก กรุณาตรวจสอบอีกครั้ง"); return; }
      if (matches.length === 1) {
        chooseQuickMember(matches[0]);
      } else {
        setQuickMatches(matches);
      }
    } catch (error) { setErr(errorText(error)); }
    finally { setQuickSearchBusy(false); }
  };
  const chooseQuickMember = (selected: MemberCardData) => {
    setQuickMatches([]);
    setCounterActionComplete(false);
    setMsg(""); setErr("");
    setLookup(selected.member_code);
    setCannabisSearch(selected.member_code);
    if (counterMode === "cannabis") {
      setMember(null);
      setCannabisLookup(selected.member_code);
    } else {
      setMember(selected);
      setCannabisLookup("");
    }
  };
  const addKratomPoints = async (amount: number) => {
    if (!member) return;
    if (!Number.isInteger(amount) || amount < 1 || amount > 20) {
      setQuickPointsError("แต้มที่เพิ่มได้ครั้งละ 1–20 แต้ม");
      return;
    }
    setQuickPointsError(""); setErr(""); setMsg(""); setBusy(true);
    const signature = JSON.stringify([member.member_code, amount]);
    const request = pointsRequest.current?.signature === signature
      ? pointsRequest.current
      : { signature, id: crypto.randomUUID() };
    pointsRequest.current = request;
    try {
      const updated = await creditStaffPoints.mutateAsync({
        data: { member_code: member.member_code, points: amount, request_id: request.id },
      });
      pointsRequest.current = null;
      setMember(updated);
      setCounterActionComplete(true);
      addRecentActivity(`เพิ่ม ${amount} แต้ม · ${member.member_code}`);
      announceSuccess(`จัดเลย! เพิ่ม +${amount} แต้มสำเร็จ · ยอดใหม่: ${updated.balance}/10 แต้ม`);
      setQuickPoints("");
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (error) { setErr(errorText(error)); }
    finally { setBusy(false); }
  };
  const creditPoints = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d+$/.test(quickPoints.trim()) || Number(quickPoints) < 1 || Number(quickPoints) > 20) {
      setQuickPointsError("แต้มที่เพิ่มได้ครั้งละ 1–20 แต้ม");
      return;
    }
    await addKratomPoints(Number(quickPoints));
  };
  const scanNextMember = () => {
    controls.current?.stop();
    controls.current = null;
    setMember(null); setCannabisSearch(""); setCannabisLookup(""); setLookup(""); setQuickLookup("");
    setQuickMatches([]); setRedeemId(null); setCannabisRedeemId(null);
    setQuickPoints(""); setQuickPointsError(""); setGrams(""); setGramsError("");
    setCounterActionComplete(false); setErr(""); setMsg(""); setScanError("");
    setScanning(true);
  };
  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    setScanning(false);
    setErr("");
    if (nextTab !== "counter") setCounterActionComplete(false);
    setShowMoreTabs(false);
  };
  useEffect(() => {
    scanResult.current = (text) => {
      if (counterMode === "cannabis") {
        setCannabisSearch(text);
        setCannabisLookup(text);
        setErr("");
        setMsg("");
      } else {
        setLookup(text);
        void find(text);
      }
    };
  }, [counterMode, find]);
  const recordCannabis = async (e: FormEvent) => {
    e.preventDefault();
    if (!cannabisCard) return;
    if (security.data?.cannabis_points_enabled !== true) {
      setErr("การสะสมแต้มกัญชายังปิดอยู่ เจ้าของร้านต้องเปิดใช้ก่อน");
      return;
    }
    if (!/^\d+$/.test(grams.trim()) || !Number.isSafeInteger(Number(grams)) || Number(grams) < 1 || Number(grams) > 999) {
      setGramsError("กรอกจำนวนกรัมเป็นจำนวนเต็ม 1–999"); return;
    }
    setGramsError(""); setErr(""); setMsg(""); setCounterActionComplete(false);
    const signature = JSON.stringify([cannabisCard.member_code, Number(grams)]);
    const request = cannabisStampRequest.current?.signature === signature
      ? cannabisStampRequest.current
      : { signature, id: crypto.randomUUID() };
    cannabisStampRequest.current = request;
    try {
      const updated = await addCannabisStamps.mutateAsync({ data: { member_code: cannabisCard.member_code, grams: Number(grams), request_id: request.id } });
      cannabisStampRequest.current = null;
      setCounterActionComplete(true);
      const pointsAdded = updated.balance - cannabisCard.balance;
      setGrams("");
      announceSuccess(`บันทึกซื้อ ${Number(grams)} กรัม · เพิ่ม +${pointsAdded} แต้มสำเร็จ · ยอดใหม่: ${updated.balance}/10 แต้ม`);
      addRecentActivity(`ซื้อกัญชา ${Number(grams)} กรัม · ${cannabisCard.member_code}`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetCannabisMemberCardQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetStaffCannabisCardQueryKey(cannabisParams) }),
      ]);
    } catch (e) { setErr(errorText(e)); }
  };
  const confirmCannabisRedeem = async () => {
    if (!cannabisCard || !cannabisRedeemId || cannabisCard.balance < 10) return;
    setErr(""); setMsg(""); setCounterActionComplete(false);
    try {
      const updated = await redeemCannabis.mutateAsync({ data: { member_code: cannabisCard.member_code, request_id: cannabisRedeemId } });
      setCannabisRedeemId(null);
      setCounterActionComplete(true);
      announceSuccess(`แลกรางวัลสำเร็จ · หัก 10 แต้มแล้ว · ยอดใหม่ ${updated.balance}/10 แต้ม`);
      addRecentActivity(`แลกรางวัล · ${cannabisCard.member_code}`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetCannabisMemberCardQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetStaffCannabisCardQueryKey(cannabisParams) }),
      ]);
    } catch (e) { setErr(`${errorText(e)} · ลองยืนยันอีกครั้งได้อย่างปลอดภัย`); }
  };
  useEffect(() => {
    if (!scanning || tab !== "counter" || auth !== true) return;
    let cancelled = false;
    let handled = false;
    const videoElement = video.current;
    if (!videoElement) {
      setScanError("ยังเปิดหน้ากล้องไม่สำเร็จ กรุณาลองอีกครั้ง");
      setScanning(false);
      return;
    }
    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        const scanner = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          videoElement,
          (result) => {
            if (!result || handled || cancelled) return;
            handled = true;
            controls.current?.stop();
            controls.current = null;
            setScanning(false);
            scanResult.current(result.getText());
          },
        );
        if (cancelled) {
          scanner.stop();
          return;
        }
        controls.current = scanner;
      } catch {
        if (!cancelled) {
          controls.current?.stop();
          controls.current = null;
          setScanning(false);
          setScanError("เปิดกล้องไม่ได้หรือไม่ได้รับอนุญาต กรุณาค้นหาด้วยรหัสสมาชิก");
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      controls.current?.stop();
      controls.current = null;
    };
  }, [scanning, tab, auth]);
  const startCamera = () => { setScanError(""); setScanning((current) => !current); };
  const record = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!isBottleCount(bottleCount)) { setBottleCountErr("กรอกจำนวนขวดเป็นจำนวนเต็ม 1–999"); return; }
    setBottleCountErr(""); setBusy(true); setErr(""); setCounterActionComplete(false);
    const bottles = Number(bottleCount);
    const price = bundlePrice(bottles);
    const signature = JSON.stringify([member.member_code, bottles, formula]);
    const request = saleRequest.current?.signature === signature ? saleRequest.current : { signature, id: crypto.randomUUID() };
    saleRequest.current = request;
    try {
      let slipPath = saleSlipPath;
      if (saleSlipFile && !slipPath) {
        slipPath = await uploadPrivateImage(saleSlipFile, "sale_slip");
        setSaleSlipPath(slipPath);
      }
      const updated = await api<MemberCardData>(`${STAFF}/stamp`, json("POST", {
        member_code: member.member_code,
        bottle_count: bottles,
        formula,
        request_id: request.id,
        ...(slipPath ? { slip_path: slipPath } : {}),
      }));
      saleRequest.current = null;
      setCounterActionComplete(true);
      setMember(updated);
      setBottleCount("");
      setSaleSlipFile(null); setSaleSlipPath(null);
      const pointsAdded = updated.balance - member.balance;
      setShiftTotals((prev) => ({ bills: prev.bills + 1, bottles: prev.bottles + bottles, baht: prev.baht + price }));
      announceSuccess(`บันทึก ${bottles} ขวด · ฿${price.toLocaleString("th-TH")} · เพิ่ม +${pointsAdded} แต้ม · ยอดใหม่ ${updated.balance}/10 แต้ม`);
      addRecentActivity(`ซื้อ ${bottles} ขวด · ฿${price.toLocaleString("th-TH")} · ${member.member_code}`);
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
      void qc.invalidateQueries({ queryKey: getListStaffSalesQueryKey(salesParams) });
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const redeem = async () => {
    if (!member || member.balance < STAMPS || !redeemId) return;
    setBusy(true); setErr(""); setCounterActionComplete(false);
    try {
      const res = await api<Partial<MemberCardData> | null>(`${STAFF}/redeem`, json("POST", { member_code: member.member_code, request_id: redeemId }));
      const updated = res && typeof res.balance === "number" && res.member_code
        ? res as MemberCardData
        : await api<MemberCardData>(`${STAFF}/member?code=${encodeURIComponent(member.member_code)}`);
      setMember(updated);
      setCounterActionComplete(true);
      setRedeemId(null); announceSuccess(`แลกรางวัลสำเร็จ · หัก 10 แต้ม · ยอดใหม่ ${updated.balance}/10 แต้ม`);
      addRecentActivity(`แลกรางวัล · ${member.member_code}`);
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (e) { setErr(`${errorText(e)} · กดยืนยันอีกครั้งได้อย่างปลอดภัย ระบบจะไม่หักซ้ำ`); } finally { setBusy(false); }
  };
  const saveSaleCorrection = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingSale || !member) return;
    const original = sales.data?.find((sale) => sale.id === editingSale.id);
    if (!original) {
      setErr("ไม่พบรายการซื้อ กรุณาโหลดรายการใหม่");
      return;
    }
    const financialChanged = Number(editingSale.bottle_count) !== original.bottle_count || editingSale.formula !== original.formula;
    const slipChanged = Boolean(editingSale.slipFile) || editingSale.removeSlip;
    if (!financialChanged && !slipChanged) {
      setErr("ยังไม่มีข้อมูลที่เปลี่ยนแปลง");
      return;
    }
    if (financialChanged && (!isBottleCount(editingSale.bottle_count) || editingSale.reason.trim().length < 3)) {
      setErr("ตรวจจำนวนขวดและระบุเหตุผลการแก้ไขอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setBusy(true); setErr(""); setMsg(""); setCounterActionComplete(false);
    try {
      if (slipChanged) {
        const slipPath = editingSale.slipFile
          ? await uploadPrivateImage(editingSale.slipFile, "sale_slip")
          : null;
        await api(`${STAFF}/sales/${encodeURIComponent(editingSale.id)}/slip`, json("PATCH", { slip_path: slipPath }));
      }
      const updated = financialChanged
        ? await correctSale.mutateAsync({
            id: editingSale.id,
            data: { bottle_count: Number(editingSale.bottle_count), formula: editingSale.formula, reason: editingSale.reason.trim() },
          })
        : null;
      setCounterActionComplete(true);
      if (updated) setMember(updated.member as MemberCardData);
      setEditingSale(null);
      announceSuccess(financialChanged
        ? `${slipChanged ? "แก้ไขรายการซื้อและสลิปแล้ว" : "แก้ไขรายการซื้อแล้ว"} · ระบบคำนวณแต้มและเศษสะสมใหม่`
        : editingSale.removeSlip ? "นำสลิปออกจากรายการแล้ว" : "บันทึกสลิปของรายการแล้ว");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListStaffSalesQueryKey(salesParams) }),
        ...(financialChanged ? [qc.invalidateQueries({ queryKey: [`${STAFF}/members`] })] : []),
      ]);
    } catch (e) { setErr(errorText(e)); }
    finally { setBusy(false); }
  };
  const saveCannabisCorrection = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingCannabis || !/^\d{1,3}$/.test(editingCannabis.grams) || Number(editingCannabis.grams) < 1 || Number(editingCannabis.grams) > 999 || editingCannabis.reason.trim().length < 3) {
      setErr("ตรวจจำนวนกรัมและระบุเหตุผลการแก้ไขอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setErr(""); setMsg(""); setCounterActionComplete(false);
    try {
      await correctCannabis.mutateAsync({
        id: editingCannabis.id,
        data: { grams: Number(editingCannabis.grams), reason: editingCannabis.reason.trim() },
      });
      setCounterActionComplete(true);
      setEditingCannabis(null);
      announceSuccess("แก้ไขรายการซื้อกัญชาแล้ว · ระบบคำนวณแต้มและเศษสะสมใหม่");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetStaffCannabisCardQueryKey(cannabisParams) }),
        qc.invalidateQueries({ queryKey: getGetCannabisMemberCardQueryKey() }),
      ]);
    } catch (e) { setErr(errorText(e)); }
  };
  const saveRedemptionCorrection = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingRedemption || !editingRedemption.reward_id || editingRedemption.reason.trim().length < 3) {
      setErr("เลือกรางวัลและระบุเหตุผลการแก้ไขอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setErr(""); setMsg(""); setCounterActionComplete(false);
    try {
      await correctRedemption.mutateAsync({
        id: editingRedemption.id,
        data: { reward_id: editingRedemption.reward_id, reason: editingRedemption.reason.trim() },
      });
      setCounterActionComplete(true);
      setEditingRedemption(null);
      announceSuccess("แก้ไขรายการแลกรางวัลแล้ว · ปรับแต้มให้ตรงกับรางวัลที่เลือก");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListRecentStaffRedemptionsQueryKey() }),
        qc.invalidateQueries({ queryKey: [`${STAFF}/redemptions`] }),
      ]);
    } catch (e) { setErr(errorText(e)); }
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!codePattern.test(code)) { setErr("รหัสสมาชิกต้องมี 6–8 ตัว"); return; }
    if (nickname.trim().length < 2 || nickname.trim().length > 20) { setErr("ชื่อเล่นต้องมี 2–20 ตัวอักษร"); return; }
    setBusy(true); setErr("");
    try {
      const added = await api<MemberCardData>(`${STAFF}/members`, json("POST", { name, member_code: code, phone, nickname: nickname.trim() }));
      announceSuccess(`เปิดบัญชี ${added.member_code} แล้ว`); setName(""); setCode(""); setPhone(""); setNickname("");
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const changePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,12}$/.test(newPin)) { setErr("PIN ใหม่ต้องเป็นตัวเลข 4–12 หลัก"); return; }
    setBusy(true); setErr("");
    try {
      await api(`${STAFF}/pin`, json("POST", { current_pin: oldPin, new_pin: newPin }));
      setOldPin(""); setNewPin(""); signOutLocal();
      announceSuccess("เปลี่ยน PIN เรียบร้อย กรุณาเข้าสู่ระบบด้วย PIN ใหม่");
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };

  if (auth === null) return <StaffAuthSkeleton />;

  return <div className="staff-workspace min-h-[100dvh]">
    <header className="staff-topline sticky top-0 z-40 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-4 h-16 flex justify-between items-center gap-2">
        <Link href="/" className="flex items-center gap-2 no-underline min-h-11"><JaguarMark size={34} /><span className="font-display text-[var(--gold-2)] tracking-wider">JAGUAR <small className="text-[var(--emerald-2)]">STAFF</small></span></Link>
        {auth && <div className="staff-topline__actions">
          <button
            type="button"
            className={`staff-sound-toggle ${soundEnabled ? "is-on" : ""}`}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "ปิดเสียงตอบรับรายการสำเร็จ" : "เปิดเสียงตอบรับรายการสำเร็จ"}
            onClick={toggleStaffSound}
          >
            {soundEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
            <span>{soundEnabled ? "เสียงเปิด" : "เสียงปิด"}</span>
          </button>
          <button className="btn btn-ghost !min-h-11 !px-4" onClick={logout}>ออกจากระบบ</button>
        </div>}
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-7">
      {!auth ? <section className="max-w-sm mx-auto pt-4">
        <div className="text-center mb-6"><p className="eyebrow">Staff access</p><h1 className="font-display text-3xl font-semibold mt-2">เข้าสู่ระบบพนักงาน</h1><p className="text-sm text-[var(--muted)] mt-2">ใช้ PIN ที่เจ้าของร้านกำหนด</p></div>
        {msg && <p role="status" className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--emerald-2)]">{msg}</p>}
        <form className="panel p-5 sm:p-6 space-y-4" onSubmit={login}>
          <div className="field"><label htmlFor="staff-pin">PIN พนักงาน</label><input id="staff-pin" type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={12} className="input text-center !text-2xl !tracking-[.5em]" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))} aria-invalid={!!err} aria-describedby={err ? "staff-pin-err" : undefined} /></div>
          <PinPad value={pin} onChange={setPin} label="แป้นตัวเลข PIN พนักงาน" />
          {err && <p id="staff-pin-err" role="alert" className="field-error">{err}</p>}
          <button className="btn btn-neon w-full" disabled={busy}>{busy && <LoadingSpinner className="loading-spinner--button" />}{busy ? "กำลังตรวจสอบ…" : "เข้าสู่พื้นที่ทำงาน"}</button>
        </form>
        <Link href="/owner" className="flex justify-center items-center min-h-11 text-sm text-[var(--muted)] mt-4">เข้าสู่ระบบเจ้าของร้าน</Link>
      </section>
      : <div className="space-y-5">
        <div className="flex flex-wrap justify-between items-end gap-3"><div><p className="eyebrow">Counter operations</p><h1 className="font-display text-3xl font-semibold">เคาน์เตอร์ร้าน</h1></div>{security.data?.default_pin && <p className="text-xs text-[var(--gold-2)]">กำลังใช้ PIN เริ่มต้น · เปลี่ยนได้ในตั้งค่า PIN</p>}</div>
        {msg && !counterActionComplete && <p role="status" className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--emerald-2)]">{msg}</p>}
        {err && <p role="alert" className="field-error">{err}</p>}
        <nav className="staff-main-nav pill-switch grid grid-cols-3 p-1 gap-1 !rounded-[22px]" aria-label="เมนูหลักพนักงาน">
          <button type="button" className="tab !px-2 !rounded-[18px] flex items-center justify-center gap-2" aria-pressed={tab === "counter"} onClick={() => selectTab("counter")}><BrandIcon name="lightning" size={19} tone={tab === "counter" ? "gold" : "neutral"} />หน้าเคาน์เตอร์</button>
          <button type="button" className="tab !px-2 !rounded-[18px] flex items-center justify-center gap-2" aria-pressed={tab === "product-sales"} data-testid="staff-tab-product-sales" onClick={() => selectTab("product-sales")}><BrandIcon name="products" size={19} tone={tab === "product-sales" ? "gold" : "neutral"} />ขายสินค้า</button>
          <button type="button" className="tab !px-2 !rounded-[18px] flex items-center justify-center gap-2" aria-expanded={showMoreTabs} aria-controls="staff-secondary-tabs" aria-pressed={showMoreTabs || (tab !== "counter" && tab !== "product-sales")} onClick={() => setShowMoreTabs((value) => !value)}><BrandIcon name="members" size={18} tone={showMoreTabs || (tab !== "counter" && tab !== "product-sales") ? "gold" : "neutral"} />{TABS.find(([id]) => id === tab && id !== "counter")?.[1] || "เมนูอื่น"}</button>
        </nav>
        {showMoreTabs && <nav id="staff-secondary-tabs" className="pill-switch grid grid-cols-2 min-[480px]:grid-cols-3 p-1 gap-1 !rounded-[18px]" aria-label="เครื่องมือพนักงานอื่น">
          {TABS.filter(([id]) => id !== "counter").map(([id, label, icon]) => <button key={id} type="button" className="tab !px-2 !rounded-[14px] flex items-center justify-center gap-2" aria-pressed={tab === id} onClick={() => selectTab(id)}><BrandIcon name={icon} size={18} tone={tab === id ? "gold" : "neutral"} />{label}</button>)}
        </nav>}

        {tab === "counter" && <div className="space-y-4">
          <div className="pill-switch staff-product-switch grid grid-cols-2 p-1 gap-1 max-w-md" aria-label="เลือกประเภทบัตร">
            <button type="button" className="tab" data-kind="kratom" aria-pressed={counterMode === "kratom"} onClick={() => { setCounterMode("kratom"); setCounterActionComplete(false); setErr(""); setMsg(""); }}>กระท่อม · ขวด</button>
            <button type="button" className="tab" data-kind="cannabis" aria-pressed={counterMode === "cannabis"} data-testid="staff-mode-cannabis" onClick={() => { setCounterMode("cannabis"); setCounterActionComplete(false); setErr(""); setMsg(""); setCannabisRedeemId(null); }}>กัญชา · กรัม</button>
          </div>
          {counterMode === "cannabis" && security.data?.cannabis_points_enabled !== true && <p className="counter-feature-disabled p-3 text-sm" role="status" data-testid="staff-cannabis-disabled">ปิดการสะสมแต้มกัญชาอยู่ · ยังแลกรางวัลได้ แต่บันทึกยอดซื้อถูกปิดไว้จนกว่าเจ้าของร้านจะเปิดใช้</p>}
          <section className="staff-quick-counter panel p-4 sm:p-5" aria-label="ค้นหาสมาชิกที่เคาน์เตอร์">
            <div className="staff-quick-counter__heading"><div><p className="eyebrow">Counter scan</p><h2 className="font-display text-xl font-semibold">สแกนหรือค้นหาสมาชิก</h2></div><span className="staff-quick-counter__hint">รหัส · เบอร์เต็ม · 4 หลักท้าย</span></div>
            <div className="staff-quick-actions">
              <form onSubmit={(event) => void quickFind(event)} className="staff-quick-counter__form">
                <div className="field"><label htmlFor="counter-quick-search">รหัสสมาชิก เบอร์โทร หรือเลขท้าย 4 หลัก</label><input id="counter-quick-search" className="input" value={quickLookup} onChange={(event) => setQuickLookup(event.target.value)} autoComplete="off" inputMode="search" placeholder="รหัสสมาชิก / เบอร์โทร / 4 หลักท้าย" /></div>
                <button className="btn btn-neon" disabled={!quickLookup.trim() || quickSearchBusy}>{quickSearchBusy ? "กำลังค้นหา…" : "ค้นหา"}</button>
              </form>
              <button type="button" className="staff-scan-button btn btn-neon" onClick={startCamera} aria-pressed={scanning}>
                <BrandIcon name="qr" size={20} tone="inherit" />{scanning ? "ปิดกล้องสแกน QR" : "เปิดกล้องสแกน QR"}
              </button>
            </div>
            {scanning && <><video ref={video} className="staff-scan-video w-full rounded-xl aspect-video mt-3" aria-label="ภาพจากกล้องสำหรับสแกน QR" /><button type="button" className="btn btn-ghost w-full mt-2" onClick={() => { controls.current?.stop(); setScanning(false); }}>ปิดกล้อง</button></>}
            {scanError && <p role="alert" className="field-error">{scanError}</p>}
            {quickMatches.length > 0 && <div className="staff-quick-matches mt-3"><p className="text-sm font-semibold">พบสมาชิกหลายรายการ · เลือกบัญชีที่ตรงกัน</p><ul>{quickMatches.map((result) => <li key={result.id}><button type="button" onClick={() => chooseQuickMember(result)}><span><strong>{result.nickname || result.display_name || "สมาชิก"}</strong><small>{result.member_code}{result.phone_masked ? ` · ${result.phone_masked}` : ""}</small></span><span className="font-mono">{result.balance} แต้ม</span></button></li>)}</ul></div>}
            {!hasCounterMember && !scanning && quickMatches.length === 0 && <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]">
              <Image src="/ui/artwork/staff-idle-mascot.webp" alt="" aria-hidden="true" width={64} height={72} sizes="64px" className="h-14 w-12 shrink-0 object-contain" />
              <span>สแกน QR หรือค้นหาสมาชิกเพื่อเริ่มรายการ</span>
            </div>}
          </section>
          <StaffWorkflow step={workflowStep} />
          {counterActionComplete && <section className="staff-success-card" role="status" aria-live="polite">
            <Image src="/ui/artwork/staff-success-mascot.webp" alt="" aria-hidden="true" width={80} height={80} sizes="80px" className="h-16 w-16 object-contain" />
            <p>{msg || "รายการสำเร็จ"}</p>
            <button type="button" className="staff-next-scan btn btn-neon" onClick={scanNextMember}>สแกนคนถัดไปทันที</button>
          </section>}
          {shiftTotals.bills > 0 && (
            <section className="panel p-4 flex flex-wrap items-center justify-between gap-3" aria-label="สรุปยอดขายกะนี้" data-testid="staff-shift-summary">
              <div>
                <p className="eyebrow">Shift counter</p>
                <p className="font-display text-base font-semibold">สรุปยอดขายที่บันทึกในกะนี้</p>
              </div>
              <div className="flex flex-wrap gap-4 font-mono text-sm tabular-nums">
                <span><strong className="text-[var(--text)]">{shiftTotals.bills}</strong> <small className="text-[var(--muted)]">บิล</small></span>
                <span><strong className="text-[var(--text)]">{shiftTotals.bottles}</strong> <small className="text-[var(--muted)]">ขวด</small></span>
                <span><strong className="text-[var(--gold-2)]">฿{shiftTotals.baht.toLocaleString("th-TH")}</strong></span>
              </div>
            </section>
          )}
          {recentActivity.length > 0 && <section className="staff-session-activity panel p-4" aria-label="กิจกรรมเคาน์เตอร์ในเซสชันนี้"><div className="flex justify-between gap-2"><h2 className="font-display text-base font-semibold">กิจกรรมล่าสุดในเซสชัน</h2><span>{recentActivity.length}/5</span></div><ol>{recentActivity.map((activity, index) => <li key={`${activity}-${index}`}>{activity}</li>)}</ol></section>}
          {counterMode === "kratom" && <div className="grid gap-5 lg:grid-cols-2 items-start">
          <section className="panel p-5 sm:p-6">
            <p className="eyebrow">Sale record</p><h2 className="font-display text-xl font-semibold mb-4">บันทึกยอดขาย / แลกรางวัล</h2>
            {member && <div className="mt-5">
              <div className={`staff-selected-member rounded-xl border p-4 flex flex-wrap gap-3 justify-between ${member.balance >= STAMPS ? "is-eligible" : ""}`}>
                <div className="min-w-0"><p className="break-words">{member.display_name}</p><p className="font-mono text-[var(--gold-2)]">{member.member_code}</p>
                  <div className="flex flex-wrap gap-2 mt-1">{member.balance >= STAMPS && <span className="ready-badge">แลกได้</span>}</div></div>
                <p className="staff-member-balance font-display">{member.balance}<span>แต้มคงเหลือ</span></p>
              </div>
              {redeemId === null
                ? member.balance >= STAMPS
                  ? <div className="mt-3 flex items-center gap-2">
                      <Image src="/ui/artwork/reward-badge.webp" alt="" aria-hidden="true" width={56} height={56} sizes="56px" className="h-12 w-12 shrink-0 object-contain" />
                      <BrandArtworkButton
                        src="/ui/artwork/redeem-action.webp"
                        label="แลกรางวัล ใช้ 10 แต้ม"
                        onClick={() => { setRedeemId(crypto.randomUUID()); setCounterActionComplete(false); setMsg(""); }}
                        disabled={busy}
                        className="!h-14 !w-auto !max-w-none min-w-0 flex-1"
                        testId="staff-redeem-cta"
                      />
                    </div>
                  : <div role="status" className="mt-3 flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2">
                      <Image src="/ui/artwork/collecting-status.webp" alt="" aria-hidden="true" width={300} height={110} sizes="(max-width: 420px) 140px, 180px" className="h-9 w-auto max-w-[48%] object-contain" />
                      <span className="text-sm text-[var(--muted)]">อีก {STAMPS - member.balance} แต้มจึงแลกรางวัลได้</span>
                    </div>
                : <div role="group" aria-labelledby="redeem-q" className="gold-alert mt-3 space-y-3">
                  <p id="redeem-q">ยืนยันแลกรางวัลให้ {member.member_code}? ระบบจะหัก 10 แต้ม</p>
                  <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRedeemId(null)}>ยกเลิก</button><button type="button" className="btn btn-gold" disabled={busy || member.balance < STAMPS} onClick={() => void redeem()} autoFocus>{busy ? "กำลังบันทึก…" : "ยืนยันแลก"}</button></div>
                </div>}
              <form onSubmit={(event) => void creditPoints(event)} className="staff-points-credit mt-4">
                <div><p className="font-semibold">เพิ่มแต้มโบนัสกระท่อม</p><p className="text-xs text-[var(--muted)]">1–20 แต้ม · แยกจากยอดซื้อและตรวจย้อนหลังได้</p></div>
                <div><p className="text-xs text-[var(--muted)] mb-2">แตะเพื่อเพิ่มทันที</p><div className="staff-point-presets" aria-label="เพิ่มแต้มด่วน">{[1, 2, 3, 5].map((points) => <button key={points} type="button" className="pt-btn" aria-label={`เพิ่ม ${points} แต้มทันที`} disabled={busy || creditStaffPoints.isPending} onClick={() => void addKratomPoints(points)}>{`+${points}`}</button>)}</div></div>
                <div className="field"><label htmlFor="quick-points">แต้มกำหนดเอง (1–20)</label><input id="quick-points" className="input" inputMode="numeric" maxLength={2} value={quickPoints} onChange={(event) => { setQuickPoints(event.target.value.replace(/\D/g, "").slice(0, 2)); setQuickPointsError(""); }} /></div>
                {quickPointsError && <p className="field-error" role="alert">{quickPointsError}</p>}
                <button className="btn btn-neon w-full" disabled={busy || !quickPoints || creditStaffPoints.isPending}>{creditStaffPoints.isPending ? "กำลังเพิ่มแต้ม…" : "เพิ่มแต้มตามจำนวน"}</button>
              </form>
              <form onSubmit={record} className="space-y-3 mt-4" noValidate>
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">เลือกจำนวนขวดยอดนิยม</p>
                  <div className="grid grid-cols-4 gap-2" role="group" aria-label="เลือกจำนวนขวดด่วน">
                    {[1, 2, 3, 6].map((preset) => {
                      const active = bottleCount === String(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          className="pt-btn flex flex-col items-center justify-center py-1.5 leading-tight"
                          aria-pressed={active}
                          data-testid={`bottle-preset-${preset}`}
                          onClick={() => { setBottleCount(String(preset)); setBottleCountErr(""); }}
                        >
                          <span className="text-sm font-semibold">{preset} ขวด</span>
                          <span className="text-[11px] opacity-80">฿{bundlePrice(preset)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="bottle-count">จำนวนขวดในบิล</label>
                  <input id="bottle-count" className="input" type="text" inputMode="numeric" autoComplete="off" maxLength={12} required value={bottleCount}
                    onChange={(e) => { const value = e.target.value; setBottleCount(value); setBottleCountErr(value && !isBottleCount(value) ? "กรอกจำนวนขวดเป็นจำนวนเต็ม 1–999" : ""); }}
                    aria-invalid={!!bottleCountErr} aria-describedby={bottleCountErr ? "bottle-count-error" : "bottle-count-rule"} />
                  {bottleCountErr ? <p id="bottle-count-error" role="alert" className="field-error">{bottleCountErr}</p> : <p id="bottle-count-rule" className="text-xs text-[var(--muted)]">บันทึกยอดขายตามบิล (฿50 / ขวด) · แต้มและยอดเศษสะสมคำนวณโดยระบบร้าน</p>}
                </div>
                <div>
                  <Label htmlFor="sale-slip-file">ภาพสลิป (ไม่บังคับ)</Label>
                  <Input id="sale-slip-file" className="mt-2" type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => { setSaleSlipFile(event.target.files?.[0] ?? null); setSaleSlipPath(null); }} />
                  <p className="mt-2 text-xs text-[var(--muted)]">JPG, PNG หรือ WebP · ไม่เกิน 8 MB · ไฟล์ดูได้เฉพาะพนักงานและเจ้าของร้าน</p>
                  {saleSlipFile && <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] p-2 text-sm">
                    <span className="min-w-0 truncate">{saleSlipFile.name}</span>
                    <button type="button" className="btn btn-ghost !min-h-10 !px-3" onClick={() => { setSaleSlipFile(null); setSaleSlipPath(null); }}>นำออก</button>
                  </div>}
                </div>
                <fieldset>
                  <legend className="text-sm mb-2 text-[var(--silver)]">เลือกสูตร</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["red", "silver", "gold"] as Formula[]).map((f) => <button type="button" className={`btn btn-ghost !min-h-[48px] !px-1 !py-2 justify-center text-xs leading-tight ${formula === f ? "border-[var(--gold)] text-[var(--gold-2)]" : ""}`} key={f} aria-label={formulaLabels[f]} aria-pressed={formula === f} onClick={() => setFormula(f)}>{formulaShort[f]}</button>)}
                  </div>
                </fieldset>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--glass-line)] bg-black/30 px-3 py-2 text-sm">
                  <span className="text-xs text-[var(--muted)]">ยอดรวม (฿50 / ขวด)</span>
                   <span className="font-semibold tabular-nums text-[var(--gold-2)]">{isBottleCount(bottleCount) ? `฿${bundlePrice(Number(bottleCount)).toLocaleString("th-TH")}` : "—"}</span>
                </div>
                <button className="btn btn-neon w-full" disabled={busy}>บันทึกยอดซื้อและแต้ม</button>
              </form>
              <section className="staff-correction-list mt-5" aria-label="รายการซื้อวันนี้">
                <div className="flex items-center justify-between gap-2"><h3>รายการซื้อวันนี้</h3><span>{sales.data?.length ?? 0}</span></div>
              {sales.isLoading ? <div className="mt-3"><StaffRowsSkeleton label="กำลังโหลดรายการซื้อ" rows={2} /></div>
                  : sales.isError ? <div className="mt-3"><ErrorState message={errorText(sales.error)} onRetry={() => void sales.refetch()} retrying={sales.isFetching} /></div>
                    : !sales.data?.length ? <div className="mt-3"><EmptyState title="วันนี้ยังไม่มีรายการซื้อ" /></div>
                      : <ul className="staff-correction-list__items">{sales.data.map((sale) => (
                        <li key={sale.id}>
                          <div className="staff-correction-list__summary">
                            <div><strong>{sale.bottle_count} ขวด · ฿{sale.amount_baht.toLocaleString("th-TH")}</strong><p>{formulaLabels[sale.formula]} · +{sale.points_awarded} แต้ม · {new Date(sale.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p></div>
                            <div className="staff-correction-list__actions">
                              {sale.corrected && <span className="staff-correction-list__badge">แก้แล้ว</span>}
                              {sale.has_slip && <a className="btn btn-ghost !min-h-11 !px-3 text-sm" href={`${STAFF}/sales/${encodeURIComponent(sale.id)}/slip`} target="_blank" rel="noreferrer">ดูสลิป</a>}
                              {sale.editable && <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-sm" onClick={() => setEditingSale({ id: sale.id, bottle_count: String(sale.bottle_count), formula: sale.formula, reason: "", slipFile: null, removeSlip: false })}>แก้ไข</button>}
                            </div>
                          </div>
                          {editingSale?.id === sale.id && <form className="staff-correction-form" onSubmit={saveSaleCorrection}>
                            <div className="staff-correction-form__fields">
                              <div className="field"><label htmlFor={`sale-count-${sale.id}`}>จำนวนขวด</label><input id={`sale-count-${sale.id}`} className="input" inputMode="numeric" value={editingSale.bottle_count} onChange={(e) => setEditingSale({ ...editingSale, bottle_count: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></div>
                              <div className="field"><label htmlFor={`sale-formula-${sale.id}`}>สูตร</label><select id={`sale-formula-${sale.id}`} className="input" value={editingSale.formula} onChange={(e) => setEditingSale({ ...editingSale, formula: e.target.value as Formula })}><option value="red">แดง · Original</option><option value="silver">ฟ้า · Refresh</option><option value="gold">ทอง · Premium</option></select></div>
                            </div>
                            <div>
                              <Label htmlFor={`sale-slip-${sale.id}`}>ภาพสลิป (ไม่บังคับ)</Label>
                              <Input id={`sale-slip-${sale.id}`} className="mt-2" type="file" accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => setEditingSale({ ...editingSale, slipFile: event.target.files?.[0] ?? null, removeSlip: false })} />
                              <p className="mt-2 text-xs text-[var(--muted)]">แนบภาพใหม่เพื่อแทนที่สลิปเดิมได้ · ไม่เกิน 8 MB</p>
                              {sale.has_slip && !editingSale.removeSlip && !editingSale.slipFile && <div className="mt-2 flex flex-wrap items-center gap-2">
                                <a className="btn btn-ghost !min-h-10 !px-3 text-sm" href={`${STAFF}/sales/${encodeURIComponent(sale.id)}/slip`} target="_blank" rel="noreferrer">ดูสลิปปัจจุบัน</a>
                                <button type="button" className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={() => setEditingSale({ ...editingSale, removeSlip: true })}>นำสลิปออก</button>
                              </div>}
                              {editingSale.slipFile && <p className="mt-2 text-sm text-[var(--muted)] break-all">{editingSale.slipFile.name}</p>}
                              {editingSale.removeSlip && <p role="status" className="mt-2 text-sm text-[var(--muted)]">สลิปจะถูกนำออกเมื่อบันทึก</p>}
                            </div>
                            <div className="field"><label htmlFor={`sale-reason-${sale.id}`}>เหตุผล (จำเป็นเมื่อแก้จำนวนหรือสูตร)</label><input id={`sale-reason-${sale.id}`} className="input" maxLength={200} value={editingSale.reason} onChange={(e) => setEditingSale({ ...editingSale, reason: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" onClick={() => setEditingSale(null)}>ยกเลิก</button><button className="btn btn-neon" disabled={correctSale.isPending || busy}>{correctSale.isPending ? "กำลังแก้ไข…" : "บันทึกรายการ"}</button></div>
                          </form>}
                        </li>
                      ))}</ul>}
              </section>
            </div>}
          </section>
          <section className="panel p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">รายการแลกรอส่งมอบ</h2>
            {queue.isLoading ? <div className="mt-4"><StaffRowsSkeleton label="กำลังโหลดรายการแลกรางวัล" rows={2} /></div> : queue.isError ? <ErrorState message={errorText(queue.error)} onRetry={() => void queue.refetch()} retrying={queue.isFetching} /> : !queue.data?.length ? <div className="mt-4"><EmptyState title="ไม่มีรายการรอยืนยัน" /></div>
            : <ul className="list-none p-0 mt-4 space-y-3">{queue.data.map((r) => <li key={r.id} className="rounded-xl border border-[var(--line-2)] p-4"><p className="font-semibold">{r.reward_name}</p><p className="text-sm text-[var(--muted)]">{r.member_nickname || r.member_code} · {r.phone_last4 ? `ลงท้าย ${r.phone_last4} · ` : ""}{r.points_spent} แต้ม</p><button className="btn btn-gold w-full mt-3" disabled={busy} onClick={async () => { setBusy(true); try { await api(`${STAFF}/redemptions/${encodeURIComponent(r.id)}/confirm`, json("POST", {})); announceSuccess("ยืนยันการส่งมอบรางวัลแล้ว"); await queue.refetch(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); } }}>ยืนยันส่งมอบ</button></li>)}</ul>}
            <section className="staff-correction-list mt-6" aria-label="รายการแลกรางวัลวันนี้">
              <div className="flex items-center justify-between gap-2"><h3>รายการแลกรางวัลวันนี้</h3><span>{recentRedemptions.data?.length ?? 0}</span></div>
              {recentRedemptions.isLoading ? <div className="mt-3"><StaffRowsSkeleton label="กำลังโหลดรายการแลกล่าสุด" rows={2} /></div>
                : recentRedemptions.isError ? <div className="mt-3"><ErrorState message={errorText(recentRedemptions.error)} onRetry={() => void recentRedemptions.refetch()} retrying={recentRedemptions.isFetching} /></div>
                  : !recentRedemptions.data?.length ? <div className="mt-3"><EmptyState title="วันนี้ยังไม่มีรายการแลก" /></div>
                    : <ul className="staff-correction-list__items">{recentRedemptions.data.map((redemption) => (
                      <li key={redemption.id}>
                        <div className="staff-correction-list__summary">
                          <div><strong>{redemption.reward_name}</strong><p>{redemption.member_nickname || redemption.member_code} · {redemption.phone_last4 ? `ลงท้าย ${redemption.phone_last4} · ` : ""}{redemption.points_spent} แต้ม · {redemption.status === "pending" ? "รอยืนยัน" : "ยืนยันแล้ว"}</p></div>
                          <div className="staff-correction-list__actions">
                            {redemption.corrected && <span className="staff-correction-list__badge">แก้แล้ว</span>}
                            <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-sm" onClick={() => setEditingRedemption({ id: redemption.id, reward_id: redemption.reward_id, reason: "" })}>แก้ไข</button>
                          </div>
                        </div>
                        {editingRedemption?.id === redemption.id && <form className="staff-correction-form" onSubmit={saveRedemptionCorrection}>
                          {staffRewards.isLoading && <LoadingState label="กำลังโหลดรางวัล" compact />}
                          {staffRewards.isError && <ErrorState message={errorText(staffRewards.error)} onRetry={() => void staffRewards.refetch()} retrying={staffRewards.isFetching} />}
                          <div className="field"><label htmlFor={`redemption-reward-${redemption.id}`}>รางวัลที่ถูกต้อง</label><select id={`redemption-reward-${redemption.id}`} className="input" value={editingRedemption.reward_id} onChange={(e) => setEditingRedemption({ ...editingRedemption, reward_id: e.target.value })}>
                            {!staffRewards.data?.some((reward) => reward.id === editingRedemption.reward_id) && <option value={editingRedemption.reward_id}>{redemption.reward_name} · ปิดใช้งาน</option>}
                            {staffRewards.data?.map((reward) => <option key={reward.id} value={reward.id}>{reward.name} · {reward.points_cost} แต้ม</option>)}
                          </select></div>
                          <div className="field"><label htmlFor={`redemption-reason-${redemption.id}`}>เหตุผลการแก้ไข</label><input id={`redemption-reason-${redemption.id}`} className="input" maxLength={200} value={editingRedemption.reason} onChange={(e) => setEditingRedemption({ ...editingRedemption, reason: e.target.value })} required /></div>
                          <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" onClick={() => setEditingRedemption(null)}>ยกเลิก</button><button className="btn btn-neon" disabled={correctRedemption.isPending || staffRewards.isLoading || staffRewards.isError || !staffRewards.data?.length}>{correctRedemption.isPending ? "กำลังแก้ไข…" : "บันทึกรายการ"}</button></div>
                        </form>}
                      </li>
                    ))}</ul>}
            </section>
          </section>
          </div>}
          {counterMode === "cannabis" && <div className="grid gap-5 lg:grid-cols-2 items-start">
            <section className="panel p-5 sm:p-6">
              <p className="eyebrow">Cannabis counter</p><h2 className="font-display text-xl font-semibold mb-4">ประทับแต้ม / แลกรางวัล</h2>
               {cannabisCardQuery.isLoading && cannabisLookup && <div className="mt-4"><StaffRowsSkeleton label="กำลังค้นหาบัตรกัญชา" rows={2} /></div>}
              {cannabisCardQuery.isError && cannabisLookup && <div className="mt-4"><ErrorState message={errorText(cannabisCardQuery.error)} onRetry={() => void cannabisCardQuery.refetch()} retrying={cannabisCardQuery.isFetching} /></div>}
              {!cannabisLookup && <div className="mt-4"><EmptyState title="ค้นหาบัตรกัญชา" body="กรอกรหัสสมาชิกหรือสแกน QR เพื่อเริ่มรายการ" /></div>}
              {cannabisCard && <div className="cannabis-staff-card mt-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold break-words">{cannabisCard.display_name || "สมาชิก"}</p><p className="font-mono text-sm text-[var(--gold-2)]">{cannabisCard.member_code}</p></div><div className="text-right"><strong className="font-display text-3xl text-[var(--emerald-2)]">{cannabisCard.balance}</strong><p className="text-xs text-[var(--muted)]">แต้มแยกจากบัตรกระท่อม</p></div></div>
                <div className="flex justify-between text-xs mt-4 text-[var(--muted)]"><span>ซื้อสะสม {cannabisCard.lifetime_earned} กรัม</span><span>ใช้แลก {cannabisCard.lifetime_redeemed} แต้ม</span></div>
                {cannabisRedeemId === null
                  ? cannabisCard.balance >= 10
                    ? <div className="mt-4 flex items-center gap-2">
                        <Image src="/ui/artwork/reward-badge.webp" alt="" aria-hidden="true" width={56} height={56} sizes="56px" className="h-12 w-12 shrink-0 object-contain" />
                        <BrandArtworkButton
                          src="/ui/artwork/redeem-action.webp"
                          label="แลกรางวัล ใช้ 10 แต้ม"
                          onClick={() => { setCannabisRedeemId(crypto.randomUUID()); setCounterActionComplete(false); setErr(""); setMsg(""); }}
                          disabled={redeemCannabis.isPending || addCannabisStamps.isPending}
                          className="!h-14 !w-auto !max-w-none min-w-0 flex-1"
                          testId="staff-cannabis-redeem-cta"
                        />
                      </div>
                    : <div role="status" className="mt-4 flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2">
                        <Image src="/ui/artwork/collecting-status.webp" alt="" aria-hidden="true" width={300} height={110} sizes="(max-width: 420px) 140px, 180px" className="h-9 w-auto max-w-[48%] object-contain" />
                        <span className="text-sm text-[var(--muted)]">อีก {10 - cannabisCard.balance} แต้มจึงแลกรางวัลได้</span>
                      </div>
                  : <div role="group" aria-labelledby="cannabis-redeem-q" className="gold-alert mt-4 space-y-3"><p id="cannabis-redeem-q">ยืนยันแลกรางวัลให้ {cannabisCard.member_code}? ระบบจะหัก 10 แต้ม</p><div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" disabled={redeemCannabis.isPending} onClick={() => setCannabisRedeemId(null)}>ยกเลิก</button><button type="button" className="btn btn-gold" disabled={redeemCannabis.isPending || cannabisCard.balance < 10} onClick={() => void confirmCannabisRedeem()}>{redeemCannabis.isPending ? "กำลังบันทึก…" : "ยืนยันแลก"}</button></div></div>}
                <form onSubmit={recordCannabis} className="space-y-3 mt-4" noValidate>
                    <fieldset className="staff-cannabis-presets"><legend>ยอดซื้อจริง · 100 กรัมต่อ 1 แต้ม</legend><div>{[{ points: 1, grams: 100 }, { points: 2, grams: 200 }, { points: 3, grams: 300 }, { points: 5, grams: 500 }].map(({ points, grams: amount }) => <button key={points} type="button" className="pt-btn" aria-label={`เพิ่ม ${points} แต้มจากการซื้อ ${amount} กรัม`} aria-pressed={grams === String(amount)} onClick={() => { setGrams(String(amount)); setGramsError(""); }}>+{points} แต้ม · {amount} กรัม</button>)}</div></fieldset>
                   <div className="field"><label htmlFor="cannabis-grams">จำนวนกรัมที่ซื้อ</label><input id="cannabis-grams" className="input" type="text" inputMode="numeric" autoComplete="off" maxLength={3} value={grams} onChange={(e) => { setGrams(e.target.value); setGramsError(e.target.value && (!/^\d+$/.test(e.target.value) || Number(e.target.value) < 1 || Number(e.target.value) > 999) ? "กรอกจำนวนกรัมเป็นจำนวนเต็ม 1–999" : ""); }} aria-invalid={!!gramsError} aria-describedby={gramsError ? "cannabis-grams-error" : "cannabis-grams-rule"} /></div>
                   {gramsError ? <p id="cannabis-grams-error" role="alert" className="field-error">{gramsError}</p> : <p id="cannabis-grams-rule" className="text-xs text-[var(--muted)]">แต้มสะสมทุก 100 กรัมตามยอดรวม · เศษกรัมทบต่อโดยระบบ</p>}
                   <button className="btn btn-neon w-full" data-testid="staff-record-cannabis-purchase" disabled={security.data?.cannabis_points_enabled !== true || addCannabisStamps.isPending || redeemCannabis.isPending}>{addCannabisStamps.isPending ? "กำลังบันทึก…" : "บันทึกยอดซื้อ"}</button>
                </form>
              </div>}
            </section>
            <section className="panel p-5 sm:p-6">
              <p className="eyebrow">Separate ledger</p><h2 className="font-display text-xl font-semibold">รายการแต้มกัญชาล่าสุด</h2>
              {!cannabisCard ? <div className="mt-4"><EmptyState title="ยังไม่ได้เลือกสมาชิก" body="รายการแต้มจะแสดงเมื่อค้นหาบัตร" /></div>
                : !cannabisCard.recent_transactions.length ? <div className="mt-4"><EmptyState title="ยังไม่มีรายการแต้ม" /></div>
                : <ul className="list-none p-0 mt-3 divide-y divide-[var(--line)]">{cannabisCard.recent_transactions.map((tx) => <li key={tx.id} className="py-3">
                  <div className="flex items-center gap-3"><span className={`cannabis-delta ${tx.delta < 0 ? "is-out" : ""}`}>{tx.delta > 0 ? `+${tx.delta}` : tx.delta}</span><div className="min-w-0 flex-1"><p className="text-sm break-words">{tx.reason}</p><p className="text-xs text-[var(--muted)]">{new Date(tx.created_at).toLocaleString("th-TH")} {tx.grams_purchased > 0 ? `· ${tx.grams_purchased} กรัม` : ""}</p></div>
                    <div className="staff-correction-list__actions">{tx.corrected && <span className="staff-correction-list__badge">แก้แล้ว</span>}{tx.editable && <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-sm" onClick={() => setEditingCannabis({ id: tx.id, grams: String(tx.grams_purchased), reason: "" })}>แก้ไข</button>}</div>
                  </div>
                  {editingCannabis?.id === tx.id && <form className="staff-correction-form" onSubmit={saveCannabisCorrection}>
                    <div className="field"><label htmlFor={`cannabis-edit-grams-${tx.id}`}>จำนวนกรัมที่ถูกต้อง</label><input id={`cannabis-edit-grams-${tx.id}`} className="input" inputMode="numeric" maxLength={3} value={editingCannabis.grams} onChange={(e) => setEditingCannabis({ ...editingCannabis, grams: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></div>
                    <div className="field"><label htmlFor={`cannabis-edit-reason-${tx.id}`}>เหตุผลการแก้ไข</label><input id={`cannabis-edit-reason-${tx.id}`} className="input" maxLength={200} value={editingCannabis.reason} onChange={(e) => setEditingCannabis({ ...editingCannabis, reason: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" onClick={() => setEditingCannabis(null)}>ยกเลิก</button><button className="btn btn-neon" disabled={correctCannabis.isPending}>{correctCannabis.isPending ? "กำลังแก้ไข…" : "บันทึกรายการ"}</button></div>
                  </form>}
                </li>)}</ul>}
            </section>
          </div>}
        </div>}

        {tab === "product-sales" && <StaffProductSales />}

        {tab === "members" && <section className="panel p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold mb-4">สมาชิกทั้งหมด</h2>
          <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
            <div className="field flex-1"><label htmlFor="member-search">กรองด้วยชื่อหรือรหัส</label><input id="member-search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <button className="btn btn-ghost">ค้นหา</button>
          </form>
          {members.isLoading ? <div className="mt-4"><StaffRowsSkeleton label="กำลังโหลดรายชื่อสมาชิก" rows={5} /></div>
          : members.isError ? <ErrorState message={errorText(members.error)} onRetry={() => void members.refetch()} retrying={members.isFetching} />
          : !visibleMembers.length ? <div className="mt-4"><EmptyState title={query ? "ไม่พบสมาชิก" : "ยังไม่มีสมาชิก"} /></div>
          : <ul className="divide-y divide-[var(--line)] list-none p-0 mt-4">{visibleMembers.map((m) => <li className="py-3 flex gap-3 items-center" key={m.id}>
              <div className="min-w-0 flex-1"><p className="break-words">{m.nickname || m.display_name || "สมาชิก"}</p><p className="font-mono text-sm text-[var(--gold-2)]">{m.member_code}{m.phone_masked ? ` · ${m.phone_masked}` : ""}</p>
               <div className="flex flex-wrap gap-2 mt-1">{m.balance >= STAMPS && <span className="ready-badge">แลกได้</span>}</div></div>
            <p className={`font-mono text-xl shrink-0 ${m.balance >= STAMPS ? "text-[var(--gold-2)]" : ""}`}>{m.balance}</p>
            <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-sm shrink-0" onClick={() => { setTab("counter"); setLookup(m.member_code); void find(m.member_code); }}>เปิด</button>
          </li>)}</ul>}
        </section>}

        {tab === "open" && <section className="panel p-5 sm:p-6 max-w-xl"><p className="eyebrow">New member</p><h2 className="font-display text-xl font-semibold mb-4">เปิดบัญชีสมาชิก</h2>
          <form onSubmit={create} className="space-y-4"><Field id="name" label="ชื่อจริง" value={name} set={setName} /><Field id="nickname" label="ชื่อเล่น" value={nickname} set={setNickname} /><Field id="code" label="รหัสสมาชิก 6–8 ตัว" value={code} set={(v) => setCode(cleanCode(v))} /><Field id="phone" label="เบอร์มือถือ" value={phone} set={setPhone} inputMode="tel" /><button className="btn btn-neon w-full" disabled={busy}>สร้างบัญชี</button></form></section>}

        {tab === "settings" && <section className="panel p-5 sm:p-6 max-w-md"><p className="eyebrow">Security</p><h2 className="font-display text-xl font-semibold mb-2">เปลี่ยน PIN พนักงาน</h2><p className="text-sm text-[var(--muted)] mb-4">หลังบันทึก ระบบจะออกจากระบบพนักงานบนอุปกรณ์นี้</p>
          <form onSubmit={changePin} className="space-y-4">
            <Field id="old-pin" label="PIN ปัจจุบัน" value={oldPin} set={(v) => setOldPin(v.replace(/\D/g, ""))} type="password" inputMode="numeric" />
            <Field id="new-pin" label="PIN ใหม่ (ตัวเลข 4–12 หลัก)" value={newPin} set={(v) => setNewPin(v.replace(/\D/g, ""))} type="password" inputMode="numeric" />
            <PinPad value={newPin} onChange={setNewPin} label="แป้นตัวเลขสำหรับ PIN ใหม่" />
            <button className="btn btn-neon w-full" disabled={busy}>บันทึก PIN</button>
          </form></section>}
        {tab === "banking" && <StaffBanking />}
      </div>}
    </main>
  </div>;
}

function Field({ id, label, value, set, type = "text", inputMode }: { id: string; label: string; value: string; set: (v: string) => void; type?: "text" | "password"; inputMode?: "numeric" | "tel" }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} className="input" type={type} inputMode={inputMode} value={value} onChange={(e) => set(e.target.value)} required maxLength={type === "password" ? 12 : 120} autoComplete="off" /></div>;
}

function StaffWorkflow({ step }: { step: number }) {
  const steps = ["ค้นหาสมาชิก", "ตรวจยอดและสิทธิ์", "บันทึกหรือแลก"];
  return <section className="staff-workflow-card" aria-label="ลำดับงานเคาน์เตอร์">
    <p className="staff-workflow-card__title">ขั้นตอนทำรายการ</p>
    <ol className="staff-workflow">
      {steps.map((label, index) => {
        const complete = step === 3 || index < step;
        const current = step < 3 && index === step;
        return <li
          className={`staff-workflow__step ${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`}
          key={label}
          aria-current={current ? "step" : undefined}
          data-state={complete ? "complete" : current ? "current" : "upcoming"}
        >
          <span className="staff-workflow__marker" aria-hidden="true">
            {complete ? <BrandIcon name="success" size={16} tone="emerald" /> : `0${index + 1}`}
          </span>
          <span>{label}</span>
        </li>;
      })}
    </ol>
  </section>;
}

function StaffRowsSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return <div className="staff-skeleton-list" role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, index) => <div className="staff-skeleton-row" key={index} aria-hidden="true">
      <div className="staff-skeleton-row__copy">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="mt-2 h-3 w-3/5" />
      </div>
      <Skeleton className="h-9 w-16 rounded-lg" />
    </div>)}
  </div>;
}

function StaffAuthSkeleton() {
  return <main className="staff-workspace min-h-[100dvh] p-4 sm:p-6">
    <div className="mx-auto max-w-6xl" role="status" aria-label="กำลังตรวจสอบสิทธิ์พนักงาน" aria-busy="true">
      <span className="sr-only">กำลังตรวจสอบสิทธิ์พนักงาน</span>
      <div className="staff-skeleton-header" aria-hidden="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="staff-skeleton-auth">
        <Skeleton className="h-5 w-32" aria-hidden="true" />
        <Skeleton className="h-8 w-56" aria-hidden="true" />
        <Skeleton className="h-12 w-full rounded-xl" aria-hidden="true" />
        <Skeleton className="h-48 w-full rounded-xl" aria-hidden="true" />
        <Skeleton className="h-12 w-full rounded-xl" aria-hidden="true" />
      </div>
    </div>
  </main>;
}
