import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircuitvalidationComponent } from './circuitvalidation.component';

describe('CircuitvalidationComponent', () => {
  let component: CircuitvalidationComponent;
  let fixture: ComponentFixture<CircuitvalidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircuitvalidationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircuitvalidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
