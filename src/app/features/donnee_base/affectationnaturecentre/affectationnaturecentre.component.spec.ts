import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationNatureCentreComponent } from './affectationnaturecentre.component';

describe('AffectationNatureCentreComponent', () => {
  let component: AffectationNatureCentreComponent;
  let fixture: ComponentFixture<AffectationNatureCentreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationNatureCentreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationNatureCentreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
