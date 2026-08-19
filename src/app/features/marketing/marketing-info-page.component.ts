import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  MARKETING_INFO_PAGES,
  MARKETING_INFO_PATH_TO_KEY,
  type MarketingInfoPageContent,
} from './marketing-info.content';

@Component({
  selector: 'app-marketing-info-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './marketing-info-page.component.html',
  styleUrl: './marketing-info-page.component.scss',
})
export class MarketingInfoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly pathKey = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.resolveKey()),
      startWith(this.resolveKey()),
    ),
    { initialValue: this.resolveKey() },
  );

  protected readonly page = computed<MarketingInfoPageContent>(() => {
    const key = this.pathKey() ?? 'privacy';
    return MARKETING_INFO_PAGES[key];
  });

  protected readonly currentYear = new Date().getFullYear();

  protected readonly navLinks = [
    { path: '/privacidad', label: 'Privacidad' },
    { path: '/terminos', label: 'Términos' },
    { path: '/seguridad', label: 'Seguridad' },
    { path: '/soporte', label: 'Soporte' },
  ] as const;

  private resolveKey() {
    const slug =
      this.route.snapshot.routeConfig?.path ??
      this.router.url.replace(/^\//, '').split('?')[0] ??
      'privacidad';
    return MARKETING_INFO_PATH_TO_KEY[slug] ?? 'privacy';
  }
}
