import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitvalidateurComponent } from './circuitvalidateur.component';

describe('CircuitvalidateurComponent', () => {
  let component: CircuitvalidateurComponent;
  let fixture: ComponentFixture<CircuitvalidateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitvalidateurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitvalidateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
