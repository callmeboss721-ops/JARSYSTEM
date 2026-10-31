/** Decorative local-identity artwork shared by customer-facing screens only. */
export function SamutPrakanArt() {
  return (
    <div className="customer-art" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <radialGradient id="sp-green-aura" cx="50%" cy="70%" r="65%">
            <stop offset="0" stopColor="#2fd98a" stopOpacity=".14" />
            <stop offset=".56" stopColor="#2fd98a" stopOpacity=".035" />
            <stop offset="1" stopColor="#2fd98a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sp-river" x1="0" y1="0" x2="1" y2=".2">
            <stop offset="0" stopColor="#2fd98a" />
            <stop offset=".56" stopColor="#74d4a0" />
            <stop offset="1" stopColor="#e5c04a" />
          </linearGradient>
        </defs>

        <ellipse cx="740" cy="690" rx="790" ry="360" fill="url(#sp-green-aura)" />

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="#64d79d" strokeOpacity=".12" strokeWidth="1">
            <path d="M-80 236C120 150 260 172 400 246S700 320 856 242s302-122 620-16" />
            <path d="M-80 268C130 182 264 205 410 278s286 70 448-8 310-119 618-12" />
            <path d="M-90 300C110 220 278 236 420 310s276 70 444-7 318-111 610-11" />
            <path d="M80 430c144-62 243-55 362 2s238 61 369-2 288-83 487-15" />
            <path d="M76 455c149-62 250-50 370 7s237 57 373-4 288-78 481-12" />
          </g>

          <g stroke="url(#sp-river)" strokeOpacity=".25" strokeWidth="1.4">
            <path d="M-70 660c180-68 320-61 476-7s289 63 431 10 315-71 677-5" />
            <path d="M-60 688c184-63 326-55 482-2s288 57 430 5 316-64 674-1" />
            <path d="M-55 718c184-56 330-49 484 3s286 52 428 2 317-57 671 4" />
            <path d="M-55 748c187-49 334-42 486 9s284 48 426 0 317-48 669 9" />
            <path d="M-40 780c184-42 333-34 485 15s282 42 424-2 318-39 659 12" />
          </g>

          <g stroke="#d6bd72" strokeOpacity=".24" strokeWidth="1.3">
            <path d="M128 682h118m-103-14h88m-73-15h57" />
            <path d="M133 653c18-20 18-35 23-50 6-19 12-30 31-43 18 13 25 24 31 43 5 15 5 30 23 50" />
            <path d="M175 560l12-44 12 44m-22-13h20m-17-16h14m-11-13h8" />
            <path d="M155 653c16-7 31-7 47 0" />
          </g>

          <g stroke="#54d394" strokeOpacity=".2" strokeWidth="1.25">
            <path d="M300 686v-49h38v49m-31-39h24m-24 13h24m-24 13h24" />
            <path d="M366 686v-75h51v75m-40-61h29m-29 17h29m-29 17h29m-29 17h29" />
            <path d="M1028 686v-58h43v58m-34-46h25m-25 14h25m-25 14h25" />
            <path d="M1090 686v-82h54v82m-42-69h30m-30 17h30m-30 17h30m-30 17h30" />
            <path d="M1168 686v-44h36v44m-28-33h20m-20 13h20" />
          </g>

          <g stroke="#d9c274" strokeOpacity=".3" strokeWidth="1.35">
            <path d="M192 720c205-35 382-44 532-27 195 23 373 13 564-19" />
            <path d="M192 727c205-35 382-44 532-27 195 23 373 13 564-19" strokeOpacity=".14" />

            <path d="M565 690V440l-29 250m29-250 29 250m-44-202h30m-35 54h39m-41 54h43m-45 54h47" />
            <path d="M565 440 388 690m177-250L445 690m120-250L503 690m62-250L625 690m-60-250L684 690m-119-250L743 690" strokeOpacity=".22" />
            <path d="M955 681V412l-31 269m31-269 31 269m-47-218h32m-37 57h42m-45 56h50m-52 56h55" />
            <path d="M955 412 770 679m185-267L825 681m130-269L885 682m70-270L1018 679m-63-267L1080 670m-125-258L1140 660" strokeOpacity=".22" />

            <path d="M1180 695h92m-84-13h76m-68-12h60m-52-11h44m-36-10h28" />
            <path d="M1210 649c4-19 15-29 26-38 11 9 22 19 26 38m-44-2h36" />
            <path d="M1236 611v-37m-8 37 8-22 8 22m-13-17h10m-8-8h6" />
          </g>

          <g stroke="#67d99e" strokeOpacity=".28" strokeWidth="1">
            <circle cx="305" cy="335" r="3" fill="#67d99e" fillOpacity=".2" />
            <circle cx="1102" cy="282" r="2.5" fill="#67d99e" fillOpacity=".18" />
            <circle cx="1280" cy="414" r="3" fill="#e5c04a" fillOpacity=".16" stroke="#e5c04a" />
            <path d="M305 335h75l29 29h58m635-111h68l42 42h65" strokeDasharray="2 8" />
          </g>
        </g>
      </svg>
    </div>
  );
}
