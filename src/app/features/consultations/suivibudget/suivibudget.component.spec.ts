import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuiviBudgetComponent } from './suivibudget.component';

describe('SuiviBudgetComponent', () => {
  let component: SuiviBudgetComponent;
  let fixture: ComponentFixture<SuiviBudgetComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuiviBudgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuiviBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
