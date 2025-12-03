import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationanalytiqueComponent } from './affectationanalytique.component';

describe('AffectationanalytiqueComponent', () => {
  let component: AffectationanalytiqueComponent;
  let fixture: ComponentFixture<AffectationanalytiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationanalytiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationanalytiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
