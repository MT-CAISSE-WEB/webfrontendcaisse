import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OprationJustifieeComponent } from './opration-justifiee.component';

describe('OprationJustifieeComponent', () => {
  let component: OprationJustifieeComponent;
  let fixture: ComponentFixture<OprationJustifieeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OprationJustifieeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OprationJustifieeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
