# Stitch Prompt: Device Pairing Page for ODS Cloud Dashboard

## 🎯 Objective
Create a beautiful, user-friendly device pairing page at `/players/pair` that allows users to pair ODS Player devices to their account by entering a 6-digit pairing code.

---

## 📋 Context

**User Flow:**
1. User boots up new ODS Player device
2. Device displays pairing screen with:
   - 6-digit code (e.g., `2624Y6`)
   - QR code linking to `https://api.ods-cloud.com/players/pair?code=2624Y6`
3. User scans QR code OR manually navigates to dashboard and enters code
4. User assigns device name and confirms pairing
5. Device is added to their account

**Current State:**
- ✅ Device pairing API working (`/api/pairing/generate`, `/api/pairing/verify`)
- ✅ Device displays pairing code and QR code
- ❌ Dashboard pairing page doesn't exist yet

---

## 🎨 Design Requirements

### Visual Style
- **Match existing dashboard aesthetic**: Dark theme, glass morphism, modern gradients
- **Reference pages**: Billing Settings (`/settings/billing`), Team Settings (`/settings/team`)
- **Color palette**: 
  - Primary: Indigo/Purple gradients
  - Success: Emerald green
  - Background: Dark slate (`#0f172a`)
  - Glass effects: `backdrop-blur-xl` with subtle borders

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  [Logo]              ODS Cloud    [Profile] │
├─────────────────────────────────────────────┤
│                                             │
│     ┌───────────────────────────────┐      │
│     │                               │      │
│     │   🎯 Pair Your Device         │      │
│     │                               │      │
│     │   Enter the 6-digit code      │      │
│     │   shown on your device        │      │
│     │                               │      │
│     │   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐   │      │
│     │   │ │ │ │ │ │ │ │ │ │ │ │   │      │
│     │   └─┘ └─┘ └─┘ └─┘ └─┘ └─┘   │      │
│     │                               │      │
│     │   Device Name (Optional)      │      │
│     │   ┌─────────────────────────┐ │      │
│     │   │ Living Room Display     │ │      │
│     │   └─────────────────────────┘ │      │
│     │                               │      │
│     │   [ Pair Device ]             │      │
│     │                               │      │
│     └───────────────────────────────┘      │
│                                             │
└─────────────────────────────────────────────┘
```

### Key Components

1. **Pairing Code Input**
   - 6 individual input boxes (one per character)
   - Auto-focus next box on input
   - Auto-submit when all 6 digits entered
   - Large, readable font
   - Visual feedback on valid/invalid codes

2. **Device Name Input**
   - Optional text field
   - Placeholder: "Living Room Display", "Kitchen Screen", etc.
   - Character limit: 50 characters

3. **Status Indicators**
   - Loading state while verifying code
   - Success animation when paired
   - Error messages for invalid/expired codes

4. **Success Screen**
   - Celebration animation (confetti or checkmark)
   - Device details (name, UUID, paired time)
   - "View Device" button → redirect to `/players`

---

## 🔧 Technical Requirements

### File Location
- **Path**: `dashboard/app/players/pair/page.tsx`
- **Route**: `/players/pair`
- **Query param**: `?code=XXXXXX` (optional, pre-fills code)

### API Integration

**Endpoint**: `POST /api/pairing/verify`

**Request:**
```typescript
{
  pairing_code: string;      // 6-digit code (uppercase)
  account_id: string;        // Current user's organization_id
  device_name?: string;      // Optional custom name
}
```

**Response (Success):**
```typescript
{
  success: true;
  player: {
    id: string;
    name: string;
    device_uuid: string;
    cpu_serial: string;
    account_id: string;
    paired_at: string;
    status: 'offline' | 'online';
  }
}
```

**Response (Error):**
```typescript
{
  error: string;  // "Invalid pairing code" | "Pairing code expired" | "Device already paired"
}
```

### State Management

```typescript
const [pairingCode, setPairingCode] = useState<string[]>(new Array(6).fill(''));
const [deviceName, setDeviceName] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [pairedDevice, setPairedDevice] = useState<Player | null>(null);
```

### Authentication
- **Require login**: Redirect to `/login` if not authenticated
- **Get account_id**: From Supabase profile (`profile.organization_id`)

---

## 🎭 User Experience Details

### Auto-Fill from QR Code
If user scans QR code with `?code=2624Y6`:
- Pre-fill the 6 input boxes
- Auto-focus on device name field
- Show "Code detected from QR scan" message

### Code Input Behavior
- Only accept alphanumeric characters (A-Z, 2-9, no 0/O/I/1)
- Auto-uppercase input
- Auto-advance to next box on input
- Backspace moves to previous box
- Paste support (paste full 6-digit code)

### Validation
- **Client-side**: Check format (6 characters, valid chars)
- **Server-side**: Verify code exists, not expired, not already paired
- **Error messages**:
  - "Invalid pairing code" → Code doesn't exist
  - "This code has expired" → Code older than 1 hour
  - "This device is already paired" → Device has account_id

### Success Flow
1. Show success animation
2. Display device details
3. Auto-redirect to `/players` after 3 seconds
4. OR provide "View Device" button for immediate navigation

---

## 🎨 Component Inspiration

**Reference existing components:**
- Glass card effect: See `/settings/billing` subscription cards
- Input styling: See `/settings/team` invite form
- Success states: See billing upgrade flow
- Loading states: See content upload flow

**Tailwind Classes to Use:**
```css
/* Glass Card */
bg-white/5 backdrop-blur-xl border border-white/10

/* Gradient Background */
bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10

/* Input Boxes */
bg-white/5 border-2 border-white/20 focus:border-indigo-500

/* Success Animation */
animate-bounce text-emerald-400
```

---

## 📱 Responsive Design

- **Desktop**: Center card, max-width 500px
- **Mobile**: Full-width card with padding
- **Tablet**: Comfortable spacing, larger touch targets

---

## ✅ Acceptance Criteria

- [ ] Page accessible at `/players/pair`
- [ ] QR code URL pre-fills pairing code
- [ ] 6-digit code input with auto-advance
- [ ] Device name input (optional)
- [ ] API call to `/api/pairing/verify` on submit
- [ ] Loading state during verification
- [ ] Error handling for invalid/expired codes
- [ ] Success animation on successful pairing
- [ ] Redirect to `/players` after pairing
- [ ] Mobile responsive design
- [ ] Matches dashboard aesthetic

---

## 🚀 Bonus Features (Optional)

- **Code validation indicator**: Green checkmark per valid character
- **Countdown timer**: Show code expiration time (1 hour)
- **Recent devices**: Show list of recently paired devices
- **Device preview**: Show device type icon based on hardware
- **Keyboard shortcuts**: Enter to submit, Escape to clear

---

## 📝 Example Code Structure

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PairDevicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  
  const [pairingCode, setPairingCode] = useState<string[]>(new Array(6).fill(''));
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Pre-fill code from QR scan
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && code.length === 6) {
      setPairingCode(code.toUpperCase().split(''));
    }
  }, [searchParams]);
  
  const handlePairDevice = async () => {
    const code = pairingCode.join('');
    if (code.length !== 6) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pairing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairing_code: code,
          account_id: profile?.organization_id,
          device_name: deviceName || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to pair device');
        return;
      }
      
      setSuccess(true);
      setTimeout(() => router.push('/players'), 3000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Glass card with pairing form */}
      {/* Code input boxes */}
      {/* Device name input */}
      {/* Submit button */}
      {/* Success/Error states */}
    </div>
  );
}
```

---

## 🎯 Final Notes

**Priority**: HIGH - This is the final piece needed for the device pairing flow to work end-to-end.

**Testing**: After implementation, test with actual device pairing code from dev device.

**Design Inspiration**: Think Apple device pairing, Stripe onboarding, or Vercel project setup - clean, simple, delightful.

**Let's make this pairing experience AMAZING! 🚀**
