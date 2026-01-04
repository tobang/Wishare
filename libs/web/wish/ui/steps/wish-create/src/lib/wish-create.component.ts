import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import {
  TuiButton,
  TuiTextfield,
  TuiInput,
  TuiLabel,
  TuiIcon,
  TuiLink,
} from '@taiga-ui/core';
import {
  TuiTextarea,
  TuiTooltip,
  TuiFiles,
  TuiCarousel,
  TuiCarouselButtons,
  TuiPagination,
} from '@taiga-ui/kit';
import { TuiForm } from '@taiga-ui/layout';
import { TuiItem } from '@taiga-ui/cdk';
import { Field, form } from '@angular/forms/signals';
import { scopeLoader } from 'scoped-translations';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import { CreateWishFormModel } from './wish-create.validation';

/** Maximum number of images allowed per wish */
const MAX_IMAGES = 5;
/** Maximum file size in bytes (5 MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Represents an image preview with data URL */
export type ImagePreview = {
  id: string;
  file: File;
  dataUrl: string;
};

@Component({
  selector: 'wishare-wish-create',
  standalone: true,
  imports: [
    FormsModule, // Required for TuiInputFiles directive
    TranslocoModule,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiIcon,
    TuiLink,
    TuiTooltip,
    TuiTextarea,
    TuiForm,
    TuiFiles,
    TuiCarousel,
    TuiCarouselButtons,
    TuiPagination,
    TuiItem,
    Field,
    FieldErrorComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishcreate',
        loader: scopeLoader((lang: string) => import(`./i18n/${lang}.json`)),
      },
    },
  ],
  templateUrl: './wish-create.component.html',
  styleUrls: ['./wish-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishCreateComponent {
  // Inputs - receive form from parent
  readonly wishForm =
    input.required<ReturnType<typeof form<CreateWishFormModel>>>();

  /** Initial images (for edit mode) */
  readonly initialImages = input<ImagePreview[]>([]);

  // Outputs - emit actions to parent
  readonly submit = output<void>();
  readonly cancel = output<void>();
  /** Emits when images change */
  readonly imagesChange = output<ImagePreview[]>();

  // Image handling state
  readonly imagePreviews = signal<ImagePreview[]>([]);
  readonly rejectedFiles = signal<File[]>([]);
  readonly carouselIndex = signal(0);

  /** Maximum file size for validation */
  readonly maxFileSize = MAX_FILE_SIZE;

  /** Set of files currently being processed to prevent duplicates */
  private readonly processingFiles = new Set<string>();

  /** Track if initial images have been set */
  private initialImagesSet = false;

  constructor() {
    // Initialize imagePreviews from initialImages input when first set
    effect(() => {
      const initial = this.initialImages();
      if (initial.length > 0 && !this.initialImagesSet) {
        this.initialImagesSet = true;
        this.imagePreviews.set([...initial]);
      }
    });
  }

  /** Computed: whether user can add more images */
  readonly canAddMoreImages = computed(
    () => this.imagePreviews().length < MAX_IMAGES,
  );

  /** Computed: total image count for display */
  readonly imageCount = computed(() => this.imagePreviews().length);

  // Getter for form validation state
  get isValid(): boolean {
    return this.wishForm()().valid();
  }

  /**
   * Handles file selection from the input
   */
  onFilesChange(files: File[]): void {
    const currentImages = this.imagePreviews();
    const remainingSlots = MAX_IMAGES - currentImages.length;

    // Filter out files that are already in the list or being processed
    const uniqueFiles = files.filter((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (this.processingFiles.has(key)) {
        return false;
      }
      if (
        currentImages.some(
          (img) => img.file.name === file.name && img.file.size === file.size,
        )
      ) {
        return false;
      }
      return true;
    });

    // Only process files that fit within the limit
    const filesToProcess = uniqueFiles.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      this.processingFiles.add(key);
      this.readFileAsDataUrl(file, key);
    });
  }

  /**
   * Handles native file input change event (Signal forms compatible)
   */
  onNativeFilesChange(event: Event, inputElement: HTMLInputElement): void {
    const files = Array.from(inputElement.files ?? []);
    this.onFilesChange(files);
    // Reset the input so the same file can be selected again
    inputElement.value = '';
  }

  /**
   * Handles rejected files (wrong type, too large, etc.)
   */
  onFilesReject(files: File[]): void {
    this.rejectedFiles.update((current) => [...current, ...files]);
  }

  /**
   * Removes a rejected file from the list
   */
  removeRejectedFile(file: File): void {
    this.rejectedFiles.update((current) => current.filter((f) => f !== file));
  }

  /**
   * Removes an image from the previews
   */
  removeImage(index: number): void {
    this.imagePreviews.update((current) => {
      const updated = current.filter((_, i) => i !== index);
      // Adjust carousel index if needed
      if (this.carouselIndex() >= updated.length && updated.length > 0) {
        this.carouselIndex.set(updated.length - 1);
      }
      return updated;
    });
    this.emitImagesChange();
  }

  /**
   * Navigates to the next image in the carousel
   */
  nextImage(): void {
    const current = this.carouselIndex();
    const total = this.imagePreviews().length;
    if (current < total - 1) {
      this.carouselIndex.set(current + 1);
    }
  }

  /**
   * Navigates to the previous image in the carousel
   */
  prevImage(): void {
    const current = this.carouselIndex();
    if (current > 0) {
      this.carouselIndex.set(current - 1);
    }
  }

  onSubmit() {
    this.submit.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  /**
   * Reads a file and converts it to a data URL for preview
   */
  private readFileAsDataUrl(file: File, key: string): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const id = crypto.randomUUID();
      this.imagePreviews.update((current) => [
        ...current,
        { id, file, dataUrl },
      ]);
      this.processingFiles.delete(key);
      this.emitImagesChange();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Emits the current images to the parent
   */
  private emitImagesChange(): void {
    this.imagesChange.emit(this.imagePreviews());
  }
}
