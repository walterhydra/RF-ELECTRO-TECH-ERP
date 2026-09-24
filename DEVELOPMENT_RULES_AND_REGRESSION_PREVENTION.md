# RF ELECTRO TECH ERP — SYSTEM INTEGRITY & REGRESSION PREVENTION GUIDELINES
*(Zero Regression Policy — Koi Bhi Naya Update Pichhle Features Ko Break Nahi Karega)*

---

## 📌 1. THE GOLDEN RULE (सर्वोच्च नियम)

> **"Whenever any new issue is fixed, feature is added, or requirement is modified, ALL previous updates, bug fixes, and existing working workflows MUST remain 100% functional and intact. A new change must NEVER break an existing feature."**
>
> *(Jab bhi koi naya feature ya bug fix kiya jaye, toh system me pichhle saare updates aur features surakshit rehne chahiye. Naya kaam karne ke chakkar me purana koi bhi feature tootna ya band hona STRICTLY PROHIBITED hai.)*

---

## 🛡️ 2. REGRESSION PREVENTION WORKFLOW (Kaam Karne Ka Niyam)

Har developer ya AI assistant ko koi bhi change karne se pehle aur baad me ye 5 steps follow karna zaroori hai:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. IMPACT ANALYSIS                                          │
  │    Check: Is component/function me pehle kya fix kiya tha?  │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. SURGICAL MODIFICATION                                    │
  │    Targeted changes only. Do NOT rewrite entire files/logic │
  │    unnecessarily. Preserve existing guards and edge cases.  │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. REGRESSION CHECK OF PREVIOUS FIXES                       │
  │    Verify that previous bug fixes still work as expected.   │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. FULL TYPE-CHECK (Zero Error Guarantee)                   │
  │    Run `npx tsc --noEmit` in both frontend and backend.    │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 5. GIT DIFF AUDIT                                           │
  │    Inspect `git diff` line-by-line before committing.       │
  └─────────────────────────────────────────────────────────────┘
```

---

## 🔒 3. CRITICAL BUSINESS RULES REGISTRY (Puraane Fixed Rules Jo Kabhi Break Nahi Hone Chahiye)

Neeche diye gaye rules test-proven hain aur system ke core logic ka hissa hain. Inhe future me kisi bhi change ke dauran disturb nahi karna hai:

### Rule 1: Job Card & WIP Numbering Rule (Never Strip Suffixes)
* **Creation / Single Lot:**
  * Job card number jo user ne banaya hai (e.g. `26-27-7151-80`, `26-27-1396-1`), WIP number **exact wahi** hona chahiye.
  * Kisi bhi code me `.replace(/-\d+$/, '')` ya `.split('-')[0]` laga kar user ke job card number ke aakhri digits (`-80`, `-1`) ko strip karna strictly banned hai.
* **Partial Split (Uncompleted Movement):**
  * Current stage par jo lot bachta hai (remaining lot), uska WIP No. **exact original** rahega (`26-27-7151-80`).
  * Agle stage par jo batch move kiya gaya hai (split lot), usme sequential letter suffix aayega:
    * First Split: `<exact_job_card_no>-A` (e.g., `26-27-7151-80-A`)
    * Second Split: `<exact_job_card_no>-B` (e.g., `26-27-7151-80-B`)
    * Third Split: `<exact_job_card_no>-C` (e.g., `26-27-7151-80-C`)
  * Random 3-digit timestamps (jaise `-167`) ya arbitrary numbers nahi lagane hain.

### Rule 2: Job Card Deletion Safety (Never Wipe Other Cards)
* **Per-Card Deletion State:**
  * Deletion loading state hamesha specific card ID (`deletingCardId`) par bind honi chahiye, na ki kisi global `isDeleting` boolean par.
  * Ek card delete karte waqt dusre card ka modal "Deleting..." ya disabled nahi dikhana chahiye.
* **Exact ID / Number Deletion Only:**
  * Backend delete API sirf exact `jobCardNo` ya exact UUID match karegi. Prefix matching (jaise `26-27`) se delete karna prohibited hai.
* **Positive Retention UI Filter:**
  * Frontend state update me har card ko default me retain kiya jata hai. Sirf target ID/cardNo hi remove hota hai.
  * Loose comparison jaise `(jc as any).parentJobCardId !== parentId` kabhi use nahi karna, kyunki `undefined !== undefined` false ban kar saare cards ko wipe out kar deta hai.

### Rule 3: Single Source of Truth & Real-Time Multi-Device Sync
* Backend database (PostgreSQL via Prisma) is 100% the Single Source of Truth.
* Jab bhi polling ya WebSocket sync se data fetch ho, optimistic client changes aur server data me clash nahi hona chahiye.
* LocalStorage sirf offline/backup ke liye hai, server data ko bina server call ke overwrite nahi karna hai.

### Rule 4: Stage Movement & Rejection Audit Integrity
* Process Flow PF-01 ke 19 stages predefined sequence me kaam karte hain.
* Quantity conservation: `Qty Received = Qty Processed + Qty Hold + Qty Rejected`.
* Kisi bhi stage par movement karte waqt quantity mismatch nahi hona chahiye.

### Rule 5: Role & Stage Scoping Safety (Never Lock Super Admin / All-Stages Views)
* **Backend RBAC Protection:**
  * Backend `findAll()` me `Super Admin` / `MASTER` role accounts ko user-profile me linked `assignedStage` se kabhi filter nahi karna hai. Super Admin hamesha 100% cards dekh sakta hai.
  * Server-side stage filtering sirf tabhi apply hogi jab `isOperator === true` ho ya query parameter me specific non-ALL stage explicitly manga gaya ho.
* **Frontend Default View:**
  * Frontend me `assignedStage` hamesha `'ALL'` (`★ ALL STAGES`) par default rahega taaki kisi bhi device par portal open karne par saare cards turant visible hon.

### Rule 6: API URL Normalization & Double Slash Prevention
* `getApiBaseUrl()` hamesha clean, trailing-slash-free URL return karega (`https://rf-electro-tech-erp.onrender.com/api/v1`).
* Frontend me `${getApiBaseUrl()}/endpoint` call karte waqt `//api/v1` (double slash) create nahi hona chahiye.
* Backend `main.ts` me global URL normalization middleware active rahega jo kisi bhi duplicate slash ko clean single slash me convert karega taaki 404 Route Not Found error kabhi na aaye.

### Rule 7: Multi-Device LocalStorage Cache & Cloud Sync Safety
* **Insecure Localhost Cache Purge:** HTTPS (Vercel) par run karte waqt browser LocalStorage me agar koi purana `http://` ya `localhost` override bacha ho, toh frontend use automatically purge karke Render Cloud backend se connect karega.
* **1-Click Cloud Sync:** Header me `🔄 Sync Cloud` button available rahega jo local cache reset karke live database se instant 0-delay fetch trigger karta hai.

---

## 📋 4. PRE-COMMIT CHECKLIST FOR DEVELOPERS & AI AGENTS

Har code change ke baad commit karne se pehle ye check karein:

- [ ] **Kya pichhla koi feature affect hua?** (Check existing related functions in the file).
- [ ] **Kya koi regex ya string manipulation purane formats ko tod rahi hai?**
- [ ] **Frontend TypeScript Validation:** `cd frontend && npx tsc --noEmit` -> Must exit with code 0.
- [ ] **Backend TypeScript Validation:** `cd backend && npx tsc --noEmit` -> Must exit with code 0.
- [ ] **Git Diff Inspection:** Run `git diff` and confirm only the intended lines were altered.

---

## 🚫 5. COMMON PITFALLS TO AVOID (Ye Galatiyan Kabhi Mat Karna)

1. **Mass Overwriting Files:** Puraane working functions ko copy-paste karke replace karte waqt purane bug-fixes ko overwrite na karein.
2. **Hardcoding Initial Stage to Single Stage:** Component state me `assignedStage` ko `'2. DRILLING'` ya kisi single stage par hardcode na karein, hamesha `'ALL'` default rakhein.
3. **Double Slash URL Construction:** `${getApiBaseUrl()}/api/v1` ya `//api/v1` banana band karein.
4. **Backend Server-Side User Profile Stage Filtering on Super Admins:** User profile ka stage super admin ke job-cards listing ko restrict na kare.

2. **Regex Over-generalization:** Kisi specific case ko fix karne ke liye aisi regex na banayein jo baaki cases ko corrupt kar de.
3. **Global State for Local Modals:** Modal ya item-level actions ke liye hamesha item ID track karein, global boolean nahi.
4. **Skipping Typecheck:** Code likhne ke baad bina typecheck kiye push karna strictly prohibited hai.

---

*Last Updated: September 2026*  
*Enforced by: RF ELECTRO TECH Engineering Team & AI Dev Pair*
