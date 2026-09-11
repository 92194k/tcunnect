# TCUnnect QRPH Integration - Step-by-Step

**All files are ready.** Follow these steps to integrate everything.

---

## PHASE 1: DATABASE SETUP (10 min)

### Step 1: Copy Migration File
From: `tcunnect-build/01_add_is_premium.sql`  
To: `supabase/migrations/20250911000001_add_is_premium.sql`

### Step 2: Push Migration to Supabase
```bash
cd supabase
supabase db push
```

✅ This adds:
- `is_premium` column to `users` table
- `qrph_payment_id` column to `premium_purchases` table
- `payment_logs` table for debugging

---

## PHASE 2: BACKEND EDGE FUNCTIONS (15 min)

### Step 1: Create Checkout Function
From: `tcunnect-build/premium-checkout.ts`  
To: `supabase/functions/premium-checkout/index.ts`

### Step 2: Create Webhook Function
From: `tcunnect-build/premium-webhook.ts`  
To: `supabase/functions/premium-webhook/index.ts`

### Step 3: Deploy Functions
```bash
supabase functions deploy premium-checkout --project-ref your-project-ref
supabase functions deploy premium-webhook --project-ref your-project-ref
```

Replace `your-project-ref` with your actual Supabase project ref.

**Verify deployment:**
```bash
supabase functions list --project-ref your-project-ref
```

You should see:
```
premium-checkout
premium-webhook
```

---

## PHASE 3: ENVIRONMENT VARIABLES (10 min)

### In Supabase Dashboard:
1. Go to your project → Settings → Edge Functions
2. Add these environment variables:

```
QRPH_API_KEY=your_api_key_from_qrph
QRPH_MERCHANT_ID=your_merchant_id
QRPH_WEBHOOK_SECRET=your_webhook_secret
APP_URL=http://localhost:5173  (for local dev)
SUPABASE_URL=your_supabase_url  (auto-filled)
SUPABASE_SERVICE_ROLE_KEY=your_service_key  (auto-filled)
```

### In your `.env` file (frontend, never commit):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> **Important:** Service key should ONLY be in Supabase Edge Functions, never in `.env`!

---

## PHASE 4: FRONTEND SETUP (20 min)

### Step 1: Create API Client
From: `tcunnect-build/api.ts`  
To: `src/lib/api.ts`

### Step 2: Update PremiumView Component
The current `PremiumView` function in `src/pages/Dashboard.tsx` (around line 1635):

**FIND THIS:**
```tsx
function PremiumView({ isPremium, onPurchase }: { isPremium: boolean; onPurchase: () => void }) {
  const [checkout, setCheckout] = useState(false);
  const [payment, setPayment] = useState("gcash");
  const [redirecting, setRedirecting] = useState(false);
  const [done, setDone] = useState(false);

  function handlePay() {
    // ... current demo code ...
  }
  // ... rest of component ...
}
```

**REPLACE WITH:** Content from `tcunnect-build/PremiumView_UPDATED.tsx`

Make sure paths in imports match your project structure:
```tsx
import { supabase } from "../lib/supabaseClient"; // Adjust if needed
import {
  initiatePremiumCheckout,
  checkPremiumStatus,
  subscribeToPremiumStatus,
} from "../lib/api"; // Your new API client
```

### Step 3: Test Locally
```bash
pnpm dev
```

Go to Premium tab and click "Get Premium — ₱30"

---

## PHASE 5: QRPH WEBHOOK SETUP (15 min)

### In QRPH Dashboard:
1. Log into https://qrph.com
2. Go to **Settings → Webhooks**
3. Click **Add Webhook**
4. Paste webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/premium-webhook
   ```
5. Select events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
   - ✅ `payment.cancelled`
6. Copy the **webhook secret** → add to Supabase env vars as `QRPH_WEBHOOK_SECRET`
7. Click **Save**

---

## TESTING CHECKLIST

### Local Testing Flow
```
1. Start dev server:
   pnpm dev

2. Sign in as student

3. Navigate to Premium tab

4. Click "Get Premium — ₱30"

5. Select payment method (GCash, Maya, QRPh)

6. Click "Continue to Pay"
   → Should redirect to QRPH checkout
   (or show QR code if implemented)

7. Complete payment on QRPH:
   - Pay ₱30 via GCash/Maya/Card
   - Get confirmation

8. QRPH redirects to success_url
   → Browser returns to /premium-success

9. Check Supabase:
   - supabase > premium_purchases table → status should be "paid"
   - supabase > users table → is_premium should be TRUE

10. Frontend should detect and show "Welcome to Premium! ✅"
```

### Debug Logs
If something fails:

**Check Edge Function logs:**
```bash
supabase functions logs premium-checkout --project-ref your-project-ref
supabase functions logs premium-webhook --project-ref your-project-ref
```

**Check payment records:**
```bash
# In Supabase SQL editor:
SELECT * FROM premium_purchases ORDER BY created_at DESC;
SELECT * FROM payment_logs ORDER BY created_at DESC;
```

---

## PRODUCTION DEPLOYMENT

### 1. Update APP_URL in Supabase
Change from `http://localhost:5173` to your live domain:
```
APP_URL=https://tcunnect.com
```

### 2. Deploy Frontend
```bash
pnpm build
# Deploy to Vercel/Netlify/your host
```

### 3. Update QRPH Webhook URL
If your Supabase project ref might change, verify webhook URL points to production:
```
https://your-prod-project-ref.supabase.co/functions/v1/premium-webhook
```

### 4. Monitor Payments
```bash
supabase functions logs premium-webhook --project-ref your-prod-project-ref --follow
```

---

## File Summary

| File | Location | Purpose |
|------|----------|---------|
| `01_add_is_premium.sql` | `supabase/migrations/` | Database schema |
| `premium-checkout.ts` | `supabase/functions/premium-checkout/` | Create payment |
| `premium-webhook.ts` | `supabase/functions/premium-webhook/` | Confirm payment |
| `api.ts` | `src/lib/` | Frontend API client |
| `PremiumView_UPDATED.tsx` | `src/pages/Dashboard.tsx` | Updated component |

---

## Troubleshooting

**Q: "QRPH API Key is invalid"**
- ✅ Check that `QRPH_API_KEY` in Supabase env vars matches what QRPH gave you
- ✅ Make sure it's the API key, not the merchant ID

**Q: "Payment redirects but webhook doesn't fire"**
- ✅ Verify webhook URL in QRPH dashboard is correct
- ✅ Check `QRPH_WEBHOOK_SECRET` is set
- ✅ Look at function logs: `supabase functions logs premium-webhook`

**Q: "Frontend says user not found"**
- ✅ Make sure you're logged in
- ✅ Check that the auth user's ID matches database user ID
- ✅ Verify `users` table has the record

**Q: "Payment record created but status never changes to 'paid'"**
- ✅ Check webhook logs (see above)
- ✅ Verify webhook URL is being called by QRPH
- ✅ Make sure `premium_purchases` table has `qrph_payment_id` column

**Q: "how do I test with real GCash?"**
- ✅ QRPH has a sandbox/test mode - check their docs
- ✅ Or use QRPH's test payment links first
- ✅ Real ₱30 payments will go to your QRPH-linked GCash account

---

## Next Steps After Integration

1. **Monitor payments** - Set up alerts/logs
2. **Track conversions** - How many students buy premium?
3. **Handle edge cases** - What if payment times out? What if user closes browser mid-checkout?
4. **Mobile optimization** - Test on actual student phones
5. **Scale** - If 50+ students buy, what happens?

---

## Questions?

If anything breaks:
1. Check the function logs first
2. Look at database records
3. Verify env vars are set correctly
4. Test webhook URL manually with curl

Good luck! 🚀
