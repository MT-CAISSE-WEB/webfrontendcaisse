import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuivibudgetbyfiltresComponent } from './suivibudgetbyfiltres.component';

describe('SuivibudgetbyfiltresComponent', () => {
  let component: SuivibudgetbyfiltresComponent;
  let fixture: ComponentFixture<SuivibudgetbyfiltresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuivibudgetbyfiltresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuivibudgetbyfiltresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
