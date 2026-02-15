import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComptabilisationComponent } from './comptabilisation.component';

describe('ComptabilisationComponent', () => {
  let component: ComptabilisationComponent;
  let fixture: ComponentFixture<ComptabilisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComptabilisationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComptabilisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
