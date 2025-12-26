# Vest Validation Utility Migration

## Overview

The `vest-validation.util.ts` has been successfully migrated from the `sfv-demo` project to the Wishare workspace following Nx best practices.

---

## Location

**Path**: `libs/web/shared/validators/src/lib/vest-validation.util.ts`

**Export**: Available via barrel export at `@wishare/web/shared/validators`

---

## What is Vest?

[Vest](https://vestjs.dev/) is a powerful validation framework that works seamlessly with Angular's new signal-based forms. It provides:

- ✅ **Declarative validation** - Write validation rules in a clear, readable way
- ✅ **Async validation** - Built-in support for async validators (API calls, etc.)
- ✅ **Field-level validation** - Validate individual fields as they change
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Framework agnostic** - Can be used with Angular, React, Vue, etc.

---

## Installation

Vest is already installed in this project:

```json
{
  "dependencies": {
    "vest": "^5.4.6"
  }
}
```

---

## Usage

### Basic Example

```typescript
import { form } from '@angular/forms/signals';
import { vestValidation } from '@wishare/web/shared/validators';
import { staticSuite, test, enforce } from 'vest';

// 1. Define your form model
interface LoginForm {
  email: string;
  password: string;
}

// 2. Create a Vest validation suite
const loginValidationSuite = staticSuite((data: LoginForm) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('email', 'Must be a valid email', () => {
    enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('password', 'Password is required', () => {
    enforce(data.password).isNotBlank();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThanOrEquals(8);
  });
});

// 3. Create your form with Vest validation
const loginForm = form<LoginForm>(
  {
    email: '',
    password: '',
  },
  (schemaPath) => {
    vestValidation(schemaPath, loginValidationSuite);
  }
);
```

### Component Usage

```typescript
import { Component } from '@angular/core';
import { form } from '@angular/forms/signals';
import { vestValidation } from '@wishare/web/shared/validators';
import { loginValidationSuite } from './login.validation';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="onSubmit()">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [(ngModel)]="loginForm.email.value"
          [class.error]="loginForm.email.errors().length > 0"
        />
        @if (loginForm.email.errors().length > 0) {
          <div class="error-message">
            {{ loginForm.email.errors()[0].message }}
          </div>
        }
      </div>

      <div>
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [(ngModel)]="loginForm.password.value"
          [class.error]="loginForm.password.errors().length > 0"
        />
        @if (loginForm.password.errors().length > 0) {
          <div class="error-message">
            {{ loginForm.password.errors()[0].message }}
          </div>
        }
      </div>

      <button type="submit" [disabled]="!loginForm.valid()">
        Login
      </button>
    </form>
  `,
})
export class LoginComponent {
  loginForm = form(
    { email: '', password: '' },
    (schemaPath) => {
      vestValidation(schemaPath, loginValidationSuite);
    }
  );

  onSubmit() {
    if (this.loginForm.valid()) {
      console.log('Form data:', this.loginForm.value());
    }
  }
}
```

---

## Advanced: Async Validation

Vest supports async validators for API calls:

```typescript
import { staticSuite, test, enforce } from 'vest';
import { lastValueFrom, fromEvent, takeUntil } from 'rxjs';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface SignupForm {
  email: string;
  username: string;
  password: string;
}

const signupValidationSuite = staticSuite((data: SignupForm) => {
  const http = inject(HttpClient);

  // Synchronous validations
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });

  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThanOrEquals(8);
  });

  // Async validation - check if email is available
  test('email', 'Email is already in use', async ({ signal }) => {
    if (!data.email) return; // Skip if empty (required test handles this)

    const available = await lastValueFrom(
      http.get<{ available: boolean }>(`/api/check-email/${data.email}`).pipe(
        takeUntil(fromEvent(signal, 'abort'))
      )
    );

    if (!available) {
      return Promise.reject();
    }
  });

  // Async validation - check if username is available
  test('username', 'Username is already taken', async ({ signal }) => {
    if (!data.username) return;

    const available = await lastValueFrom(
      http.get<{ available: boolean }>(`/api/check-username/${data.username}`).pipe(
        takeUntil(fromEvent(signal, 'abort'))
      )
    );

    if (!available) {
      return Promise.reject();
    }
  });
});
```

---

## Vest Enforcement Rules

Vest provides many built-in enforcement rules:

### String Validations
```typescript
enforce(value).isNotBlank()
enforce(value).isNotEmpty()
enforce(value).equals('expected')
enforce(value).matches(/pattern/)
enforce(value).longerThan(5)
enforce(value).longerThanOrEquals(8)
enforce(value).shorterThan(20)
enforce(value).shorterThanOrEquals(15)
enforce(value).lengthEquals(10)
enforce(value).lengthNotEquals(5)
```

### Number Validations
```typescript
enforce(value).isNumber()
enforce(value).greaterThan(0)
enforce(value).greaterThanOrEquals(1)
enforce(value).lessThan(100)
enforce(value).lessThanOrEquals(99)
enforce(value).isBetween(1, 100)
enforce(value).isNegative()
enforce(value).isPositive()
```

### Array Validations
```typescript
enforce(value).isArray()
enforce(value).isArrayOf(Number)
enforce(value).isEmpty()
enforce(value).isNotEmpty()
```

### Custom Validations
```typescript
enforce(value).condition((val) => val.startsWith('https://'))
enforce(value).test((val) => myCustomValidation(val))
```

---

## Migration Details

### Source
- **Project**: sfv-demo
- **Path**: `/Users/torbenbang/git/sfv-demo/src/app/shared/vest-validation.util.ts`

### Destination
- **Project**: wishare
- **Library**: `@wishare/web/shared/validators`
- **Path**: `libs/web/shared/validators/src/lib/vest-validation.util.ts`

### Changes Made
- ✅ Migrated complete utility file
- ✅ Updated import example to use barrel export
- ✅ Added to validators library exports
- ✅ No code changes - works as-is with Angular signal forms

---

## Key Features

### 1. Field-Level Validation
The utility validates individual fields as they change, not the entire form:

```typescript
// Only validates the changed field
loginForm.email.value = 'test@example.com';
// Only email validation runs
```

### 2. Async Support
Built-in support for async validators with proper cancellation:

```typescript
test('email', 'Checking availability...', async ({ signal }) => {
  // API call is automatically cancelled if field changes
  await checkEmail(data.email).pipe(
    takeUntil(fromEvent(signal, 'abort'))
  );
});
```

### 3. Error Mapping
Automatically maps Vest errors to Angular signal form errors:

```typescript
loginForm.email.errors(); // Array of validation errors
// [{ kind: 'vest', message: 'Email is required', field: emailField }]
```

### 4. Performance Optimized
- Only validates changed fields
- Caches previous validation results
- Defers async updates to avoid signal conflicts

---

## Integration with Existing Code

### With URL Validator
You can combine Vest validation with existing validators:

```typescript
import { vestValidation, urlValidator } from '@wishare/web/shared/validators';

const myForm = form(
  { url: '', title: '' },
  (schemaPath) => {
    // Use Vest for complex validation
    vestValidation(schemaPath, myValidationSuite);
    
    // Can still use traditional validators
    schemaPath.url.validators = [urlValidator];
  }
);
```

---

## Testing

### Unit Testing Vest Suites

```typescript
import { test as vestTest, enforce, staticSuite } from 'vest';

describe('Login Validation Suite', () => {
  it('should validate required email', () => {
    const result = loginValidationSuite({ email: '', password: 'test123' });
    
    expect(result.hasErrors('email')).toBe(true);
    expect(result.getErrors('email')).toContain('Email is required');
  });

  it('should validate email format', () => {
    const result = loginValidationSuite({ email: 'invalid', password: 'test123' });
    
    expect(result.hasErrors('email')).toBe(true);
    expect(result.getErrors('email')).toContain('Must be a valid email');
  });

  it('should pass with valid data', () => {
    const result = loginValidationSuite({
      email: 'test@example.com',
      password: 'test12345'
    });
    
    expect(result.isValid()).toBe(true);
  });
});
```

---

## Examples in Wishare Project

You can now use this utility in any form throughout the Wishare app:

### Wishlist Form
```typescript
const wishlistForm = form(
  { title: '', description: '', visibility: 'draft' },
  (schemaPath) => {
    vestValidation(schemaPath, wishlistValidationSuite);
  }
);
```

### Wish Form
```typescript
const wishForm = form(
  { title: '', url: '', price: 0, description: '' },
  (schemaPath) => {
    vestValidation(schemaPath, wishValidationSuite);
  }
);
```

---

## Resources

- **Vest Documentation**: https://vestjs.dev/
- **Angular Signal Forms**: https://angular.dev/guide/forms/signals
- **Vest GitHub**: https://github.com/ealush/vest

---

## Summary

✅ **Migrated**: `vest-validation.util.ts`  
✅ **Location**: `libs/web/shared/validators`  
✅ **Export**: `@wishare/web/shared/validators`  
✅ **Dependencies**: Vest 5.4.6 already installed  
✅ **Compatible**: Works with Angular signal forms  
✅ **Ready to use**: Import and use in any component  

---

## Quick Start

```typescript
// 1. Import
import { vestValidation } from '@wishare/web/shared/validators';
import { staticSuite, test, enforce } from 'vest';

// 2. Create validation suite
const suite = staticSuite((data: MyForm) => {
  test('field', 'Error message', () => {
    enforce(data.field).isNotBlank();
  });
});

// 3. Use in form
const myForm = form(myModel, (path) => {
  vestValidation(path, suite);
});

// 4. Access errors in template
@if (myForm.field.errors().length > 0) {
  <div>{{ myForm.field.errors()[0].message }}</div>
}
```

**You're ready to use Vest validation throughout your Wishare application!** 🚀
