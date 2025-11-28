import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationCaissierComponent } from './affectation-caissier.component';

describe('AffectationCaissierComponent', () => {
  let component: AffectationCaissierComponent;
  let fixture: ComponentFixture<AffectationCaissierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationCaissierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationCaissierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
