# Accessibility Guidelines

## Semantic HTML First

**Rule:** Use native HTML elements before reaching for ARIA.

### ✅ Good: Native Elements

```tsx
<button onClick={handleClick}>Submit</button>
<nav>
  <ul>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
<main>
  <h1>Page Title</h1>
  <p>Content...</p>
</main>
```

### ❌ Bad: Divs with Roles

```tsx
<div role="button" onClick={handleClick}>Submit</div>
<div role="navigation">
  <div role="list">
    <div role="listitem"><div role="link">About</div></div>
  </div>
</div>
<div role="main">
  <div role="heading" aria-level="1">Page Title</div>
</div>
```

---

## ARIA When Necessary

Use ARIA attributes only when:
- Native semantics don't exist (tabs, accordions, comboboxes)
- You need to enhance native elements (aria-expanded, aria-current)
- Custom controls require accessible state (aria-pressed, aria-selected)

### Dialog Accessibility

```tsx
"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function AccessibleDialog({ open, onOpenChange, title, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

**Key behaviors:**
- Focus automatically trapped in dialog
- Escape key closes
- Click outside closes (if configured)
- Focus returns to trigger on close
- Screen reader announces dialog role and label

### Accordion Accessibility

```tsx
"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AccessibleAccordion({ items }) {
  return (
    <Accordion type="single" collapsible>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

**Key behaviors:**
- Arrow keys navigate between triggers
- Space/Enter expands/collapses
- aria-expanded indicates state
- Screen reader announces panel visibility

---

## Form Field Accessibility

### Complete Pattern

```tsx
<div>
  <label htmlFor="email" className="text-sm font-medium">
    Email address
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
    className={cn(
      "input",
      error && "border-destructive"
    )}
  />
  {error && (
    <p id="email-error" role="alert" className="text-sm text-destructive">
      {error}
    </p>
  )}
</div>
```

**Key points:**
- `label` with `htmlFor` connects to `input` `id`
- `aria-invalid` indicates validation state
- `aria-describedby` links to error message
- Error has `role="alert"` for screen readers
- Visual styling matches semantic state

### Required Fields

```tsx
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input
  id="name"
  required
  aria-required="true"
/>
```

### Helper Text

```tsx
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-describedby="password-hint"
/>
<p id="password-hint" className="text-sm text-muted-foreground">
  Must be at least 8 characters
</p>
```

---

## Keyboard Navigation

### Essential Patterns

**Tab Order**
- Tab order follows visual order
- All interactive elements keyboard accessible
- Skip links for main content

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**Focus Management**

```tsx
"use client";
import { useEffect, useRef } from "react";

export function SearchInput({ autoFocus = false }) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);
  
  return <input ref={inputRef} type="search" />;
}
```

**Focus Trap in Modals**

Shadcn Dialog handles this automatically, but for custom implementations:

```tsx
"use client";
import { useEffect, useRef } from "react";

export function CustomModal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    document.addEventListener("keydown", handleTab);
    firstElement?.focus();
    
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

---

## Color and Contrast

### Minimum Ratios

**WCAG AA (minimum):**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**WCAG AAA (enhanced):**
- Normal text: 7:1
- Large text: 4.5:1

### Don't Use Color Alone

❌ **Bad: Color only**
```tsx
<div className="text-red-500">Error occurred</div>
<div className="text-green-500">Success</div>
```

✅ **Good: Color + icon + text**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>An error occurred</AlertDescription>
</Alert>

<Alert variant="default">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Operation completed</AlertDescription>
</Alert>
```

### Focus Indicators

❌ **Bad: Removed outline**
```tsx
<button className="focus:outline-none">
  Submit
</button>
```

✅ **Good: Custom visible focus**
```tsx
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Submit
</button>
```

---

## Images and Media

### Alt Text

```tsx
// Informative image
<img src="/chart.png" alt="Sales increased 40% in Q4" />

// Decorative image
<img src="/divider.png" alt="" />

// Functional image (in button)
<button>
  <img src="/save-icon.png" alt="Save document" />
</button>

// Next.js Image
<Image
  src="/hero.jpg"
  alt="Team collaborating in modern office"
  width={1200}
  height={600}
/>
```

### Video Captions

```tsx
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track
    kind="captions"
    src="/captions.vtt"
    srcLang="en"
    label="English"
    default
  />
</video>
```

---

## Screen Reader Patterns

### Visually Hidden but Screen Reader Accessible

```tsx
// Tailwind utility
<span className="sr-only">Loading...</span>

// Custom CSS
<span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
  Loading...
</span>
```

### Skip Navigation

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

### Live Regions

```tsx
"use client";
import { useState } from "react";

export function SearchResults() {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  return (
    <div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isSearching && "Searching..."}
        {!isSearching && `${results.length} results found`}
      </div>
      
      <div role="region" aria-label="Search results">
        {results.map(result => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

Before marking a UI complete:

### Keyboard
- [ ] Tab through all interactive elements
- [ ] Tab order follows visual order
- [ ] All actions accessible without mouse
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All content announced correctly
- [ ] Form fields properly labeled
- [ ] Errors announced
- [ ] Dynamic changes announced (live regions)

### Color and Contrast
- [ ] Test with browser DevTools contrast checker
- [ ] Information not conveyed by color alone
- [ ] Focus indicators have sufficient contrast

### Tools
- [ ] Run aXe DevTools or Lighthouse
- [ ] Fix all errors and critical warnings
- [ ] Review moderate warnings

---

## Common Mistakes to Avoid

### ❌ Don't

- Use `div` or `span` as buttons
- Remove focus outlines without replacement
- Use `onClick` without keyboard support on non-interactive elements
- Forget `alt` text on images
- Use color alone to convey information
- Create keyboard traps
- Use `aria-label` when visible text would work
- Use `placeholder` as the only label
- Use non-semantic markup for layout

### ✅ Do

- Use semantic HTML elements
- Maintain logical focus order
- Provide text alternatives
- Test with assistive technology
- Keep accessibility in mind from the start (not afterthought)
- Use ARIA only when necessary
- Provide visible focus indicators
- Label all form controls
- Use landmarks (`<main>`, `<nav>`, `<aside>`)

---

## Radix UI (shadcn) Accessibility

Shadcn components built on Radix UI have accessibility baked in:

### Dialog
- ✅ Focus trap
- ✅ Escape key handling
- ✅ Return focus on close
- ✅ ARIA attributes

### Dropdown Menu
- ✅ Arrow key navigation
- ✅ Type-ahead search
- ✅ Focus management
- ✅ ARIA attributes

### Tabs
- ✅ Arrow key navigation
- ✅ Focus management
- ✅ ARIA attributes

### Tooltip
- ✅ Focus/hover triggers
- ✅ Escape key dismiss
- ✅ ARIA attributes

**Trust Radix, but verify:** Test with real assistive technology, don't assume it's perfect.

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Quick Reference

**Semantic HTML > ARIA > JavaScript workarounds**

**Test with:**
1. Keyboard only (no mouse)
2. Screen reader (NVDA/VoiceOver)
3. Browser DevTools (Lighthouse, aXe)
4. Real users with disabilities (if possible)

**When in doubt:** Use the most semantic element available and test with a screen reader.
