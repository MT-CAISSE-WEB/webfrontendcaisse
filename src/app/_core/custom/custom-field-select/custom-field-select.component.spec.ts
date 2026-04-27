import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldSelectComponent } from './custom-field-select.component';

describe('CustomFieldSelectComponent', () => {
  let component: CustomFieldSelectComponent;
  let fixture: ComponentFixture<CustomFieldSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomFieldSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomFieldSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
