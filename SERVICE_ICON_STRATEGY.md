# Service Icon Strategy - SMS Providers

## Problem Statement

SMS Online Pro uses a CSS sprite with 644 service icons at specific coordinates. Tiger SMS likely has different service codes and no public sprite sheet. We need a unified icon system that works across all providers.

## Solution Architecture

### 1. SMS Online Pro - Use Native Sprite

**Sprite URL:** `https://static.sms-online.pro/sprites/service-full.css`

**Implementation:**
```tsx
// Component usage
<div 
  className="service-icon"
  style={{
    backgroundImage: 'url(https://static.sms-online.pro/sprites/service-full.png)',
    backgroundPosition: `-${coords.x}px -${coords.y}px`,
    width: '40px',
    height: '40px'
  }}
/>
```

**Advantages:**
- ✅ 644 services covered
- ✅ Professional, consistent design
- ✅ Single HTTP request for all icons
- ✅ Already hosted on CDN

**Disadvantages:**
- ⚠️ External dependency (but stable)
- ⚠️ SMS Online Pro branding (but generic icons)

---

### 2. Tiger SMS - Fallback Strategy

Tiger SMS doesn't provide a sprite sheet. We have 3 options:

#### Option A: Emoji Fallback (RECOMMENDED)
Map service codes to relevant emoji:

```typescript
const SERVICE_EMOJI_MAP: Record<string, string> = {
  wa: '💬',  // WhatsApp
  tg: '✈️',  // Telegram
  ig: '📷',  // Instagram
  fb: '👥',  // Facebook
  go: '🔍',  // Google
  tw: '🐦',  // Twitter
  vk: '🎵',  // VK
  ok: '👌',  // OK
  // ... etc
}
```

**Advantages:**
- ✅ No external dependencies
- ✅ Works everywhere (Unicode support)
- ✅ Lightweight
- ✅ Accessible

**Disadvantages:**
- ⚠️ Less professional than custom icons
- ⚠️ Emoji rendering varies by OS

#### Option B: Use SMS Online Pro Sprite for Both
Since the sprite is generic (not branded), use it for Tiger SMS too.

**Advantages:**
- ✅ Consistent UI across providers
- ✅ Professional icons

**Disadvantages:**
- ⚠️ Tiger SMS service codes might not match SMS Online Pro codes
- ⚠️ Dependency on SMS Online Pro CDN

#### Option C: Custom Icon Font
Create our own icon font with common services.

**Advantages:**
- ✅ Full control
- ✅ Scalable vectors

**Disadvantages:**
- ❌ Time-consuming to create
- ❌ Maintenance burden
- ❌ Out of scope for v1

---

### 3. Grizzly SMS - Use SMS Online Pro Sprite

Grizzly SMS likely uses similar service codes to SMS Online Pro (both follow SMS-Activate pattern).

---

## Recommended Implementation

### Phase 1: SMS Online Pro Native Sprite
```typescript
// packages/plugins/sms-providers/src/icons/sms-online-pro.ts
export function getSmsOnlineProIcon(serviceCode: string) {
  const coords = SMS_ONLINE_PRO_SPRITE_MAP[serviceCode]
  if (!coords) return null
  
  return {
    type: 'sprite' as const,
    url: 'https://static.sms-online.pro/sprites/service-full.png',
    position: { x: coords.x, y: coords.y },
    size: { width: 40, height: 40 }
  }
}
```

### Phase 2: Tiger SMS Emoji Fallback
```typescript
// packages/plugins/sms-providers/src/icons/emoji-fallback.ts
export function getEmojiIcon(serviceCode: string) {
  const emoji = SERVICE_EMOJI_MAP[serviceCode] || '📱'
  
  return {
    type: 'emoji' as const,
    emoji,
  }
}
```

### Phase 3: Unified Icon Component
```tsx
// apps/app/src/components/ServiceIcon.tsx
interface ServiceIconProps {
  serviceCode: string
  providerCode: string
  size?: number
}

export function ServiceIcon({ serviceCode, providerCode, size = 40 }: ServiceIconProps) {
  const icon = getServiceIcon(serviceCode, providerCode)
  
  if (icon.type === 'sprite') {
    return (
      <div
        className="service-icon"
        style={{
          backgroundImage: `url(${icon.url})`,
          backgroundPosition: `-${icon.position.x}px -${icon.position.y}px`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundSize: `${icon.size.width * (size / 40)}px auto`,
        }}
        aria-label={getServiceName(serviceCode)}
      />
    )
  }
  
  if (icon.type === 'emoji') {
    return (
      <span
        className="service-icon-emoji"
        style={{ fontSize: `${size}px` }}
        role="img"
        aria-label={getServiceName(serviceCode)}
      >
        {icon.emoji}
      </span>
    )
  }
  
  return null
}
```

---

## Service Code Mapping Strategy

### Problem: Different Providers, Different Codes?

Tiger SMS and SMS Online Pro might use different service codes for the same service.

**Example:**
- SMS Online Pro: `wa` = WhatsApp
- Tiger SMS: `whatsapp` = WhatsApp (hypothetical)

### Solution: Normalization Layer

```typescript
// packages/plugins/sms-providers/src/mappings/service-normalization.ts

/**
 * Normalize provider-specific service codes to canonical codes
 */
export function normalizeServiceCode(
  code: string,
  providerCode: string
): string {
  // Tiger SMS specific mappings
  if (providerCode === 'tiger_sms') {
    const tigerMap: Record<string, string> = {
      'whatsapp': 'wa',
      'telegram': 'tg',
      'instagram': 'ig',
      // ... etc
    }
    return tigerMap[code] || code
  }
  
  // SMS Online Pro and Grizzly use canonical codes
  return code
}
```

---

## Action Items

### Immediate (Phase 0)
1. ✅ Parse all 644 SMS Online Pro sprite coordinates
2. ⏳ Test Tiger SMS API to get their service list
3. ⏳ Compare service codes between providers
4. ⏳ Create normalization mapping if needed

### Phase 1 Implementation
1. Create `ServiceIcon` component
2. Implement SMS Online Pro sprite support
3. Implement emoji fallback for Tiger SMS
4. Add service name mappings (wa → WhatsApp)

### Phase 2 Enhancement
1. Download and self-host SMS Online Pro sprite (optional)
2. Create custom icons for services not in sprite
3. Add icon caching strategy

---

## Testing Strategy

```typescript
// Test cases
describe('ServiceIcon', () => {
  it('renders SMS Online Pro sprite for wa service', () => {
    const { container } = render(
      <ServiceIcon serviceCode="wa" providerCode="sms_online_pro" />
    )
    expect(container.querySelector('.service-icon')).toHaveStyle({
      backgroundPosition: '-125px -5px'
    })
  })
  
  it('renders emoji fallback for Tiger SMS', () => {
    const { container } = render(
      <ServiceIcon serviceCode="wa" providerCode="tiger_sms" />
    )
    expect(container.textContent).toBe('💬')
  })
  
  it('normalizes Tiger SMS service codes', () => {
    expect(normalizeServiceCode('whatsapp', 'tiger_sms')).toBe('wa')
  })
})
```

---

## Decision: Use Option A + B Hybrid

**For SMS Online Pro & Grizzly:** Use native sprite (professional, complete)

**For Tiger SMS:** 
- Primary: Use SMS Online Pro sprite with normalized codes
- Fallback: Emoji if service code not found in sprite

This gives us:
- ✅ Consistent professional UI
- ✅ Coverage for all services
- ✅ Graceful degradation
- ✅ No custom icon creation needed

---

## Next Steps

1. Test Tiger SMS API to get actual service codes
2. Create service code normalization mapping
3. Implement `ServiceIcon` component
4. Add to component library with Storybook examples
