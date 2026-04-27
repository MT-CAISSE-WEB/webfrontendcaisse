import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecaissementJustifierComponent } from './decaissement-justifier.component';

describe('DecaissementJustifierComponent', () => {
  let component: DecaissementJustifierComponent;
  let fixture: ComponentFixture<DecaissementJustifierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecaissementJustifierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecaissementJustifierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
