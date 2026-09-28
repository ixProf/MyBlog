import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { TranslationService } from '../services/translation.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('HomeComponent Hero Headline', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let ts: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    ts = TestBed.inject(TranslationService);
    fixture = TestBed.createComponent(HomeComponent);
  });

  it('renders English headline with highlight exclusively on "Prof"', () => {
    ts.setLanguage('en');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.hero-title') as HTMLElement;
    const highlightEl = fixture.nativeElement.querySelector('.highlight-prof') as HTMLElement;

    expect(titleEl).toBeTruthy();
    expect(highlightEl).toBeTruthy();
    expect(highlightEl.textContent?.trim()).toBe('Prof');
    expect(titleEl.textContent?.trim().replace(/\s+/g, ' ')).toBe('My Name is Mahmoud, But You Can Call Me Prof.');
  });

  it('renders Arabic headline with highlight exclusively on "بروف"', () => {
    ts.setLanguage('ar');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.hero-title') as HTMLElement;
    const highlightEl = fixture.nativeElement.querySelector('.highlight-prof') as HTMLElement;

    expect(titleEl).toBeTruthy();
    expect(highlightEl).toBeTruthy();
    expect(highlightEl.textContent?.trim()).toBe('بروف');
    expect(titleEl.textContent?.trim().replace(/\s+/g, ' ')).toBe('اسمي محمود، بس ناديني بروف.');
  });
});
