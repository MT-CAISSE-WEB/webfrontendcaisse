import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationdemandeComponent } from './validationdemande.component';

describe('ValidationdemandeComponent', () => {
  let component: ValidationdemandeComponent;
  let fixture: ComponentFixture<ValidationdemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationdemandeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidationdemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
