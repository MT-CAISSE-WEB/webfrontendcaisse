import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametrePageComponent } from './parametre-page.component';

describe('ParametrePageComponent', () => {
  let component: ParametrePageComponent;
  let fixture: ComponentFixture<ParametrePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametrePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametrePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
