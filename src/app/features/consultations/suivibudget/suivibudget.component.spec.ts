import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuivibudgetComponent } from './suivibudget.component';

describe('SuivibudgetComponent', () => {
  let component: SuivibudgetComponent;
  let fixture: ComponentFixture<SuivibudgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuivibudgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuivibudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
