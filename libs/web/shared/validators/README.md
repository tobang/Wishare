# Web Shared Validators Library

Shared validation utilities for the Wishare application.

## Validators

### URL Validator
Validates URL format for wishes and other entities.

```typescript
import { urlValidator } from '@wishare/web/shared/validators';

// Use in form
field.validators = [urlValidator];
```

### Vest Validation Utility
Integrates Vest validation framework with Angular signal forms.

```typescript
import { vestValidation } from '@wishare/web/shared/validators';
import { staticSuite, test, enforce } from 'vest';

const validationSuite = staticSuite((data: MyForm) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotBlank();
  });
});

const myForm = form(model, (schemaPath) => {
  vestValidation(schemaPath, validationSuite);
});
```

## Documentation

See `VEST-VALIDATION-MIGRATION.md` for complete Vest validation guide.

## Import

```typescript
import { vestValidation, urlValidator } from '@wishare/web/shared/validators';
```
