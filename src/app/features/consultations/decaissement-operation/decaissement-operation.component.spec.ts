import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecaissementOperationComponent } from './decaissement-operation.component';

describe('DecaissementOperationComponent', () => {
  let component: DecaissementOperationComponent;
  let fixture: ComponentFixture<DecaissementOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecaissementOperationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecaissementOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
