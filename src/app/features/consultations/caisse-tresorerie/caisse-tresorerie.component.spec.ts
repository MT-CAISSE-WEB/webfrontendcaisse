import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaisseTresorerieComponent } from './caisse-tresorerie.component';

describe('CaisseTresorerieComponent', () => {
  let component: CaisseTresorerieComponent;
  let fixture: ComponentFixture<CaisseTresorerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaisseTresorerieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaisseTresorerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
